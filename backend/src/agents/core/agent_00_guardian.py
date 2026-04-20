"""
Agente #0: Guardian Router
Responsabilidad: Clasificar intención y enrutar al router correcto
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)


class Agent00Guardian:
    """
    Guardian Router — Punto de entrada de todas las requests.

    Clasifica la intención del usuario y decide qué router llamar:
    - ecommerce  → EcommerceRouter
    - crm        → CRMRouter
    - erp        → ERPRouter
    - meta       → MetaRouter

    Input:
        {
            "query":     str   — Texto del usuario
            "tenant_id": str   — ID del tenant
            "user_id":   str   — ID del usuario
        }

    Output:
        {
            "success":    bool
            "router":     str   — Router destino
            "confidence": float — 0.0-1.0
            "scores":     dict  — Puntajes por router
        }
    """

    def __init__(self):
        self.name = "Agent #0 - Guardian Router"
        self.patterns: Dict[str, list[str]] = {
            "ecommerce": [
                r"\b(mercado\s*libre|meli|ml|amazon|shopify|producto|orden|venta|precio)\b",
                r"\b(inventario|stock|fulfillment|envío|catálogo|listing)\b",
                r"\b(devolución|reembolso|paquetería|guía)\b",
            ],
            "crm": [
                r"\b(whatsapp|instagram|facebook|mensaje|chat|lead|cliente|prospecto)\b",
                r"\b(cotización|oportunidad|pipeline|nps|ticket|soporte|seguimiento)\b",
                r"\b(inbox|conversación|contacto|deal)\b",
            ],
            "erp": [
                r"\b(factura|cfdi|sat|timbre|rfc|contabilidad|finanzas|contable)\b",
                r"\b(compra|proveedor|almacén|logística|inventario\s*erp|cxc|cxp)\b",
                r"\b(póliza|diario|balance|flujo\s*de\s*efectivo|conciliación)\b",
            ],
            "meta": [
                r"\b(anuncio|campaña|publicación|ads|facebook\s*ads|instagram\s*ads)\b",
                r"\b(boost|alcance|impresiones|conversión|creativo)\b",
            ],
        }
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Clasifica intención y retorna el router destino."""
        try:
            query = input_data.get("query", "").lower()
            if not query:
                raise ValueError("Missing required field: query")

            scores: Dict[str, int] = {router: 0 for router in self.patterns}
            for router, pats in self.patterns.items():
                for pat in pats:
                    if re.search(pat, query):
                        scores[router] += 1

            total = sum(scores.values())
            best_router = max(scores, key=scores.get)
            confidence = scores[best_router] / total if total > 0 else 0.0

            logger.info(f"{self.name} → {best_router} (confidence={confidence:.2f})")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat(),
                "router": best_router,
                "confidence": round(confidence, 4),
                "scores": scores,
            }

        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }


guardian = Agent00Guardian()
