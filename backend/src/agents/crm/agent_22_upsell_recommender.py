"""
Agente #22: Upsell Recommender
Responsabilidad: Recomendar productos complementarios y oportunidades de upsell/cross-sell
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Product affinity map (cross-sell rules — tool/hardware domain)
_AFFINITY: Dict[str, List[str]] = {
    "taladro":      ["brocas", "nivel_laser", "guantes", "extension_electrica"],
    "amoladora":    ["discos_corte", "discos_desbaste", "mascara_proteccion", "guantes"],
    "sierra":       ["hojas_sierra", "cinta_metrica", "guantes", "gafas_proteccion"],
    "compresor":    ["pistola_pintura", "manguera", "accesorios_neumaticos"],
    "soldadora":    ["electrodos", "mascara_soldar", "guantes_cuero", "combo_cables"],
}


class Agent22UpsellRecommender:
    """
    Upsell Recommender — Sugiere productos complementarios basados en historial.

    Input:
        {
            "customer_id": str  — (opcional) para personalizar por historial
            "sku":         str  — (opcional) producto base para cross-sell
            "tenant_id":   str
        }
    Output:
        { "customer_id", "recommendations": [...], "upsell_value_mxn", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #22 - Upsell Recommender"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "customer_id": data.get("customer_id"),
            "sku": data.get("sku"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        customer_id = data.get("customer_id")
        try:
            from src.utils.database import db
            if customer_id:
                rows = await db.fetch_all(
                    """SELECT oi.sku, oi.product_name, SUM(oi.quantity) AS qty
                       FROM order_items oi
                       JOIN orders o ON o.id = oi.order_id
                       WHERE o.tenant_id=$1::uuid AND o.customer_id=$2
                       GROUP BY oi.sku, oi.product_name
                       ORDER BY qty DESC LIMIT 10""",
                    tenant_id, customer_id,
                )
                if rows:
                    purchased = [r["sku"] or "" for r in rows]
                    return self._build_recommendations(customer_id, purchased, data.get("sku"))
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(customer_id, data.get("sku"))

    def _build_recommendations(self, customer_id: Optional[str], purchased: List[str], base_sku: Optional[str]) -> Dict:
        recs = []
        for sku in purchased[:3]:
            sku_lower = sku.lower()
            for keyword, complements in _AFFINITY.items():
                if keyword in sku_lower:
                    for comp in complements[:2]:
                        recs.append({
                            "sku": comp.upper(),
                            "reason": f"Complementa con {sku}",
                            "type": "cross_sell",
                            "estimated_price_mxn": 350.0,
                        })

        if not recs:
            return self._mock_result(customer_id, base_sku)

        return {
            "customer_id": customer_id,
            "recommendations": recs[:6],
            "upsell_value_mxn": round(sum(r["estimated_price_mxn"] for r in recs[:6]), 2),
            "source": "database",
        }

    def _mock_result(self, customer_id: Optional[str], sku: Optional[str]) -> Dict:
        return {
            "customer_id": customer_id,
            "base_sku": sku,
            "recommendations": [
                {"sku": "BRC-SET-PRO",  "name": "Set de Brocas Profesional 50 pzas", "type": "cross_sell", "price_mxn": 480.0,  "reason": "Complementa taladros — 68% de clientes lo compran junto"},
                {"sku": "EXT-10M-16A",  "name": "Extensión Eléctrica 10m 16A",       "type": "cross_sell", "price_mxn": 320.0,  "reason": "Accesorio esencial para herramienta eléctrica"},
                {"sku": "GTE-NITRI-L",  "name": "Guantes de Nitrilo Caja 100",       "type": "cross_sell", "price_mxn": 250.0,  "reason": "EPI requerido — alta recompra mensual"},
                {"sku": "TAL-850W-PRO", "name": "Taladro Percutor 850W Pro",         "type": "upsell",    "price_mxn": 2200.0, "reason": "Upgrade de modelo actual — +35% potencia"},
                {"sku": "NIV-LASER-5",  "name": "Nivel Laser 5 líneas",             "type": "add_on",    "price_mxn": 1850.0, "reason": "Complementa instalaciones profesionales"},
            ],
            "upsell_value_mxn": 5100.0,
            "conversion_probability_pct": 34.0,
            "source": "mock_data",
        }
