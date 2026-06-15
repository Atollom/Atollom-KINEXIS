"""Agent #14 — Returns Manager (multicanal)"""
import logging
from datetime import datetime
from src.utils.database import db

logger = logging.getLogger(__name__)

_REASON_LABELS = {
    "producto_defectuoso": "Producto defectuoso",
    "no_deseado": "Compra no deseada",
    "error_envio": "Error de envío",
    "descripcion_incorrecta": "Descripción incorrecta",
    "llegó_dañado": "Llegó dañado",
}

_REFUND_RATES = {
    "producto_defectuoso": 1.0,
    "llegó_dañado": 1.0,
    "error_envio": 1.0,
    "descripcion_incorrecta": 0.9,
    "no_deseado": 0.8,
}


class ReturnsManagerAgent:
    name = "Returns Manager #14"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        order_id = data.get("order_id")
        channel = data.get("channel", "")
        reason = data.get("reason", "no_deseado")
        items = data.get("items", [])

        if not order_id:
            return {"success": False, "error": "order_id required", "data": {}}

        try:
            order = await db.fetch_one(
                "SELECT id, total FROM orders WHERE tenant_id=$1 AND id=$2",
                tenant_id, order_id,
            )
            order_total = float(order["total"]) if order else sum(
                float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in items
            )

            refund_rate = _REFUND_RATES.get(reason, 0.9)
            refund_amount = round(order_total * refund_rate, 2)

            return_number = f"RET-{int(datetime.now().timestamp())}"

            row = await db.fetch_one(
                """INSERT INTO returns
                   (tenant_id, return_number, order_id, platform, channel, reason,
                    refund_amount, status, items, created_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8::jsonb,NOW())
                   RETURNING id""",
                tenant_id, return_number, str(order_id), channel, channel, reason,
                refund_amount, __import__("json").dumps(items),
            )

            logger.info("Return created: %s order=%s tenant=%s", return_number, order_id, tenant_id)
            return {
                "success": True,
                "data": {
                    "return_id": str(row["id"]) if row else None,
                    "return_number": return_number,
                    "order_id": str(order_id),
                    "channel": channel,
                    "reason": _REASON_LABELS.get(reason, reason),
                    "refund_amount": refund_amount,
                    "refund_rate_pct": int(refund_rate * 100),
                    "status": "pending",
                    "next_step": "Autorizar devolución y generar guía de retorno",
                },
            }
        except Exception as exc:
            logger.error("ReturnsManager failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


returns_manager = ReturnsManagerAgent()
