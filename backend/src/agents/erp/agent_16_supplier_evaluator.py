"""
Agente #16: Supplier Evaluator
Responsabilidad: Evaluar proveedores (precio/tiempo/calidad) y recomendar mejor opción
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"evaluate", "compare", "recommend"}
VALID_PRIORITIES = {"cost", "speed", "quality"}

# Pesos por prioridad: (cost_weight, speed_weight, quality_weight)
PRIORITY_WEIGHTS: Dict[str, tuple] = {
    "cost":    (0.60, 0.20, 0.20),
    "speed":   (0.20, 0.60, 0.20),
    "quality": (0.20, 0.20, 0.60),
}


def _normalize_price_score(price: float, prices: List[float]) -> float:
    """Lowest price = 100."""
    min_price = min(prices)
    if price == 0:
        return 0.0
    return round((min_price / price) * 100, 2)


def _normalize_speed_score(days: int, all_days: List[int]) -> float:
    """Fastest (min days) = 100."""
    min_days = min(all_days)
    if days == 0:
        return 100.0
    return round((min_days / days) * 100, 2)


def _normalize_quality_score(rating: float) -> float:
    """Rating on 5.0 scale → 0-100."""
    return round((rating / 5.0) * 100, 2)


class Agent16SupplierEvaluator:
    """
    Supplier Evaluator — Evaluación y comparación de proveedores.

    Estrategias de prioridad:
      cost    → Mayor peso al precio más bajo
      speed   → Mayor peso a la entrega más rápida
      quality → Mayor peso a la calificación más alta

    Input:
        {
            "action":    str  — evaluate | compare | recommend
            "suppliers": list — [{id, name, price_per_unit, delivery_days, rating}]
            "priority":  str  — cost | speed | quality
        }

    Output:
        {
            "recommendation": {supplier_id, reason, score, trade_off}
            "comparison":     [{id, name, score, price_score, speed_score, quality_score}]
        }
    """

    REQUIRED_FIELDS = ["action", "suppliers"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #16 - Supplier Evaluator"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evalúa y recomienda proveedores."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} action={validated['action']} suppliers={len(validated['suppliers'])}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        suppliers = data["suppliers"]
        if not isinstance(suppliers, list) or len(suppliers) == 0:
            raise ValueError("suppliers must be a non-empty list")

        for i, s in enumerate(suppliers):
            for req in ("id", "price_per_unit", "delivery_days", "rating"):
                if req not in s:
                    raise ValueError(f"suppliers[{i}] missing field: {req}")
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

    def _score_suppliers(self, suppliers: List[Dict], priority: str) -> List[Dict]:
        prices = [float(s["price_per_unit"]) for s in suppliers]
        days = [int(s["delivery_days"]) for s in suppliers]
        cw, sw, qw = PRIORITY_WEIGHTS[priority]

        scored = []
        for s in suppliers:
            ps = _normalize_price_score(float(s["price_per_unit"]), prices)
            ss = _normalize_speed_score(int(s["delivery_days"]), days)
            qs = _normalize_quality_score(float(s["rating"]))
            total = round(cw * ps + sw * ss + qw * qs, 2)
            scored.append({
                "id": s["id"],
                "name": s.get("name", s["id"]),
                "score": total,
                "price_score": ps,
                "speed_score": ss,
                "quality_score": qs,
                "price_per_unit": float(s["price_per_unit"]),
                "delivery_days": int(s["delivery_days"]),
                "rating": float(s["rating"]),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Fetch supplier history from Supabase
        - Include on-time delivery rate in scoring
        - Integration with purchase order auto-creation
        """
        suppliers = data["suppliers"]
        priority = data["priority"]
        scored = self._score_suppliers(suppliers, priority)
        best = scored[0]
        second = scored[1] if len(scored) > 1 else None

        trade_off = None
        if second:
            diff_price = round(best["price_per_unit"] - second["price_per_unit"], 2)
            diff_days = best["delivery_days"] - second["delivery_days"]
            parts = []
            if diff_price != 0:
                parts.append(f"{'More' if diff_price > 0 else 'Less'} expensive by ${abs(diff_price):.2f}")
            if diff_days != 0:
                parts.append(f"{'slower' if diff_days > 0 else 'faster'} by {abs(diff_days)} days vs #{second['id']}")
            trade_off = "; ".join(parts) if parts else "Similar performance"

        recommendation = {
            "supplier_id": best["id"],
            "supplier_name": best["name"],
            "reason": f"Best {priority} score: {best['delivery_days']}d delivery, {best['rating']} rating",
            "score": best["score"],
            "trade_off": trade_off,
        }

        return {
            "action": data["action"],
            "priority": priority,
            "recommendation": recommendation,
            "comparison": [
                {k: v for k, v in s.items() if k != "name" or True}
                for s in scored
            ],
            "note": "Real supplier history integration pending — Fase 2",
        }


supplier_evaluator = Agent16SupplierEvaluator()
