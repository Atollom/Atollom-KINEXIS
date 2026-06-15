"""Agent #16 — Supplier Evaluator"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)

_WEIGHTS = {
    "cost":    {"price_score": 0.5, "delivery_days": 0.2, "quality_score": 0.3},
    "speed":   {"price_score": 0.2, "delivery_days": 0.6, "quality_score": 0.2},
    "quality": {"price_score": 0.2, "delivery_days": 0.2, "quality_score": 0.6},
}


def _score_supplier(s: dict, priority: str) -> float:
    w = _WEIGHTS.get(priority, _WEIGHTS["quality"])
    price_score = max(0, 100 - float(s.get("avg_price_index", 50)))
    days = float(s.get("avg_delivery_days", 7))
    delivery_score = max(0, 100 - days * 10)
    quality = float(s.get("quality_score", 75))
    return round(
        price_score * w["price_score"]
        + delivery_score * w["delivery_days"]
        + quality * w["quality_score"],
        1,
    )


class SupplierEvaluatorAgent:
    name = "Supplier Evaluator #16"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "evaluate")
        priority = data.get("priority", "quality")
        try:
            if action in ("evaluate", "compare", "recommend"):
                return await self._evaluate(tenant_id, action, priority, data)
            return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("SupplierEvaluator failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _evaluate(self, tenant_id: str, action: str, priority: str, data: dict) -> dict:
        supplier_ids = data.get("suppliers", [])
        if supplier_ids:
            placeholders = ",".join(f"${i+2}" for i in range(len(supplier_ids)))
            rows = await db.fetch_all(
                f"SELECT * FROM approved_suppliers WHERE tenant_id=$1 AND id IN ({placeholders})",
                tenant_id, *supplier_ids,
            )
        else:
            rows = await db.fetch_all(
                "SELECT * FROM approved_suppliers WHERE tenant_id=$1 AND active=TRUE ORDER BY name LIMIT 20",
                tenant_id,
            )

        if not rows:
            return {"success": False, "error": "No suppliers found", "data": {}}

        scored = []
        for s in rows:
            score = _score_supplier(s, priority)
            tier = "preferred" if score >= 75 else "acceptable" if score >= 50 else "review"
            scored.append({
                "id": str(s["id"]),
                "name": s.get("name"),
                "score": score,
                "tier": tier,
                "avg_delivery_days": s.get("avg_delivery_days"),
                "quality_score": s.get("quality_score"),
                "avg_price_index": s.get("avg_price_index"),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)

        result = {"evaluated": scored, "total": len(scored), "priority_by": priority}
        if action == "recommend":
            result["recommended"] = scored[0] if scored else None
        return {"success": True, "data": result}


supplier_evaluator = SupplierEvaluatorAgent()
