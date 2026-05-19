"""
Agente #16: Supplier Evaluator
Responsabilidad: Evaluar y comparar proveedores — incluye historial real de Supabase
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS    = {"evaluate", "compare", "recommend"}
VALID_PRIORITIES = {"cost", "speed", "quality"}

PRIORITY_WEIGHTS: Dict[str, tuple] = {
    "cost":    (0.60, 0.20, 0.20),
    "speed":   (0.20, 0.60, 0.20),
    "quality": (0.20, 0.20, 0.60),
}


def _normalize_price(price: float, prices: List[float]) -> float:
    mn = min(prices)
    return round((mn / price) * 100, 2) if price > 0 else 0.0


def _normalize_speed(days: int, all_days: List[int]) -> float:
    mn = min(all_days)
    return round((mn / days) * 100, 2) if days > 0 else 100.0


def _normalize_quality(rating: float) -> float:
    return round((rating / 5.0) * 100, 2)


class Agent16SupplierEvaluator:
    """
    Supplier Evaluator — Scoring multi-criterio con historial de Supabase.

    Input:
        {
            "action":    str  — evaluate | compare | recommend
            "suppliers": list — [{id, name, price_per_unit, delivery_days, rating}]
            "priority":  str  — cost | speed | quality
            "tenant_id": str  (opcional — para enriquecer con historial real)
        }
    """

    REQUIRED_FIELDS = ["action", "suppliers"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #16 - Supplier Evaluator"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s action=%s suppliers=%s priority=%s",
                        self.name, validated["action"],
                        len(validated["suppliers"]), validated.get("priority"))
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                raise ValueError(f"Missing required field: {f}")
        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")
        suppliers = data["suppliers"]
        if not isinstance(suppliers, list) or not suppliers:
            raise ValueError("suppliers must be non-empty list")
        for i, s in enumerate(suppliers):
            for req in ("id", "price_per_unit", "delivery_days", "rating"):
                if req not in s:
                    raise ValueError(f"suppliers[{i}] missing: {req}")
            if float(s["price_per_unit"]) <= 0:
                raise ValueError(f"suppliers[{i}] price_per_unit must be > 0")
            if int(s["delivery_days"]) < 0:
                raise ValueError(f"suppliers[{i}] delivery_days must be >= 0")
            if not (0 <= float(s["rating"]) <= 5):
                raise ValueError(f"suppliers[{i}] rating must be 0-5")
        priority = data.get("priority", "quality")
        if priority not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Valid: {VALID_PRIORITIES}")
        data["priority"] = priority
        return data

    async def _enrich_with_history(
        self, suppliers: List[Dict], tenant_id: Optional[str]
    ) -> List[Dict]:
        """Loads on-time delivery rate from purchase_orders history."""
        if not tenant_id:
            return suppliers
        from src.utils.database import db
        enriched = []
        for s in suppliers:
            try:
                row = await db.fetch_one(
                    """
                    SELECT
                        COUNT(*) AS total_pos,
                        COALESCE(AVG(
                            CASE WHEN actual_delivery_date <= delivery_date THEN 1.0 ELSE 0.0 END
                        ), 1.0) AS on_time_rate
                    FROM purchase_orders
                    WHERE tenant_id = $1 AND supplier_id = $2
                      AND status = 'received'
                    """,
                    tenant_id, str(s["id"]),
                )
                if row and int(row["total_pos"]) > 0:
                    s = dict(s)
                    s["on_time_rate"] = round(float(row["on_time_rate"]), 2)
                    s["total_pos"]    = int(row["total_pos"])
            except Exception as e:
                logger.debug("%s history lookup failed for %s: %s", self.name, s["id"], e)
            enriched.append(s)
        return enriched

    def _score(self, suppliers: List[Dict], priority: str) -> List[Dict]:
        prices   = [float(s["price_per_unit"]) for s in suppliers]
        days     = [int(s["delivery_days"]) for s in suppliers]
        cw, sw, qw = PRIORITY_WEIGHTS[priority]
        scored = []
        for s in suppliers:
            ps = _normalize_price(float(s["price_per_unit"]), prices)
            ss = _normalize_speed(int(s["delivery_days"]), days)
            qs = _normalize_quality(float(s["rating"]))
            # Bonus for high on-time delivery (up to +5 points)
            otr = float(s.get("on_time_rate", 1.0))
            total = round(cw * ps + sw * ss + qw * qs + (otr * 5), 2)
            scored.append({
                "id":             s["id"],
                "name":           s.get("name", str(s["id"])),
                "score":          total,
                "price_score":    ps,
                "speed_score":    ss,
                "quality_score":  qs,
                "on_time_rate":   otr,
                "price_per_unit": float(s["price_per_unit"]),
                "delivery_days":  int(s["delivery_days"]),
                "rating":         float(s["rating"]),
                "total_pos":      s.get("total_pos", 0),
            })
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        priority  = data["priority"]
        tenant_id = data.get("tenant_id")
        suppliers = await self._enrich_with_history(data["suppliers"], tenant_id)
        scored    = self._score(suppliers, priority)
        best      = scored[0]
        second    = scored[1] if len(scored) > 1 else None

        trade_off = None
        if second:
            dp = round(best["price_per_unit"] - second["price_per_unit"], 2)
            dd = best["delivery_days"] - second["delivery_days"]
            parts = []
            if dp:
                parts.append(f"{'Más caro' if dp>0 else 'Más barato'} ${abs(dp):.2f} vs #{second['id']}")
            if dd:
                parts.append(f"{'Más lento' if dd>0 else 'Más rápido'} {abs(dd)}d vs #{second['id']}")
            trade_off = "; ".join(parts) or "Rendimiento similar"

        return {
            "action":         data["action"],
            "priority":       priority,
            "recommendation": {
                "supplier_id":   best["id"],
                "supplier_name": best["name"],
                "reason":        f"Mejor score {priority}: {best['delivery_days']}d, rating {best['rating']}, on-time {best['on_time_rate']*100:.0f}%",
                "score":         best["score"],
                "trade_off":     trade_off,
            },
            "comparison": scored,
            "source": "supabase+input" if tenant_id else "input",
        }


supplier_evaluator = Agent16SupplierEvaluator()
