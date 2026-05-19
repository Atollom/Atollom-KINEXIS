"""
Agente #30: Purchase Orders
Responsabilidad: Crear y gestionar órdenes de compra — persiste en Supabase + email Resend
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

VALID_ACTIONS      = {"create", "approve", "send", "list"}
VALID_PAYMENT_TERMS = {"30_days", "60_days", "immediate", "consignment"}

RESEND_URL = "https://api.resend.com/emails"
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@onboarding.resend.dev")


def _po_email_html(po: Dict) -> str:
    items_html = "".join(
        f"<tr><td style='padding:6px 12px'>{i.get('sku','')}</td>"
        f"<td style='padding:6px 12px'>{i.get('description', i.get('sku',''))}</td>"
        f"<td style='padding:6px 12px;text-align:center'>{i.get('quantity',0)}</td>"
        f"<td style='padding:6px 12px;text-align:right'>${float(i.get('unit_price',0)):,.2f}</td></tr>"
        for i in po.get("items", [])
    )
    return f"""
<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px">
  <div style="background:#14532d;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#CCFF00;font-size:22px;margin:0">KINEXIS</h1>
    <p style="color:#bbf7d0;font-size:12px;margin:4px 0 0">Orden de Compra</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827;font-size:15px">Estimado proveedor,</p>
    <p style="color:#4b5563">Se ha generado la siguiente orden de compra para su revisión y confirmación.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f3f4f6">
        <td style="padding:8px 12px;font-weight:700">N° OC</td>
        <td style="padding:8px 12px">{po.get('po_number','')}</td>
        <td style="padding:8px 12px;font-weight:700">Fecha</td>
        <td style="padding:8px 12px">{po.get('created_at','')[:10]}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:700">Entrega</td>
        <td style="padding:8px 12px">{po.get('delivery_date','—')}</td>
        <td style="padding:8px 12px;font-weight:700">Pago</td>
        <td style="padding:8px 12px">{po.get('payment_terms','').replace('_',' ')}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <thead><tr style="background:#14532d;color:#fff">
        <th style="padding:8px 12px;text-align:left">SKU</th>
        <th style="padding:8px 12px;text-align:left">Descripción</th>
        <th style="padding:8px 12px;text-align:center">Cantidad</th>
        <th style="padding:8px 12px;text-align:right">Precio unit.</th>
      </tr></thead>
      <tbody>{items_html}</tbody>
      <tfoot><tr style="background:#f3f4f6;font-weight:700">
        <td colspan="3" style="padding:10px 12px;text-align:right">Total</td>
        <td style="padding:10px 12px;text-align:right;color:#16a34a">${po.get('total',0):,.2f} MXN</td>
      </tr></tfoot>
    </table>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Atollom Labs · contacto@atollom.com</p>
  </div>
</div>"""


class Agent30PurchaseOrders:
    """
    Purchase Orders — Generación, aprobación y envío de OCs.

    Acciones:
      create  → genera OC en Supabase (estado: pending_approval)
      approve → cambia estado a approved
      send    → envía OC al proveedor por email (Resend) + estado sent_to_supplier
      list    → lista OCs del tenant

    Input:
        {
            "action":        str  — create | approve | send | list
            "tenant_id":     str
            "supplier_id":   str  — (requerido en create/approve/send)
            "supplier_email": str — (requerido en send)
            "items":         list — [{sku, description, quantity, unit_price}]
            "delivery_date": str  — ISO date
            "payment_terms": str  — 30_days | 60_days | immediate | consignment
            "po_number":     str  — (requerido en approve/send)
        }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #30 - Purchase Orders"
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s action=%s tenant=%s po=%s",
                        self.name, validated["action"], validated["tenant_id"],
                        result.get("po_number", "—"))
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

        if data["action"] in {"create", "approve", "send"}:
            if not data.get("supplier_id"):
                raise ValueError("supplier_id required")
            items = data.get("items", [])
            if data["action"] == "create":
                if not isinstance(items, list) or not items:
                    raise ValueError("items must be a non-empty list")
                for i, item in enumerate(items):
                    if "sku" not in item:
                        raise ValueError(f"items[{i}] missing sku")
                    if int(item.get("quantity", 0)) <= 0:
                        raise ValueError(f"items[{i}] quantity must be > 0")
                    if float(item.get("unit_price", 0)) < 0:
                        raise ValueError(f"items[{i}] unit_price must be >= 0")

        pt = data.get("payment_terms", "30_days")
        if pt not in VALID_PAYMENT_TERMS:
            raise ValueError(f"Invalid payment_terms. Valid: {VALID_PAYMENT_TERMS}")
        data["payment_terms"] = pt
        return data

    def _calculate_total(self, items: list) -> float:
        return round(sum(float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items), 2)

    async def _next_po_number(self, tenant_id: str) -> str:
        from src.utils.database import db
        try:
            row = await db.fetch_one(
                "SELECT COUNT(*) AS cnt FROM purchase_orders WHERE tenant_id = $1",
                tenant_id,
            )
            seq = (int(row["cnt"]) + 1) if row else 1
        except Exception:
            seq = 1
        return f"PO-{datetime.now(timezone.utc).year}-{seq:03d}"

    async def _persist_po(self, tenant_id: str, po: Dict) -> None:
        from src.utils.database import db
        try:
            await db.execute(
                """
                INSERT INTO purchase_orders
                    (tenant_id, po_number, supplier_id, items, total,
                     payment_terms, delivery_date, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, NOW(), NOW())
                ON CONFLICT (po_number) DO UPDATE SET
                    status = EXCLUDED.status, updated_at = NOW()
                """,
                tenant_id,
                po["po_number"],
                po["supplier_id"],
                __import__("json").dumps(po.get("items", [])),
                po["total"],
                po["payment_terms"],
                po.get("delivery_date"),
                po["status"],
            )
        except Exception as e:
            logger.warning("%s DB persist failed: %s", self.name, e)

    async def _send_po_email(self, supplier_email: str, po: Dict) -> Dict:
        if not self.resend_api_key:
            return {"sent": False, "reason": "RESEND_API_KEY not configured"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    RESEND_URL,
                    headers={"Authorization": f"Bearer {self.resend_api_key}",
                             "Content-Type": "application/json"},
                    json={"from": EMAIL_FROM, "to": [supplier_email],
                          "subject": f"Orden de Compra {po['po_number']} — KINEXIS",
                          "html": _po_email_html(po)},
                )
            if resp.status_code in (200, 201):
                return {"sent": True, "email_id": resp.json().get("id"), "to": supplier_email}
            logger.warning("%s Resend error %s: %s", self.name, resp.status_code, resp.text[:200])
            return {"sent": False, "reason": f"HTTP {resp.status_code}"}
        except Exception as e:
            return {"sent": False, "reason": str(e)}

    async def _list_pos(self, tenant_id: str) -> list:
        from src.utils.database import db
        try:
            rows = await db.fetch_all(
                "SELECT po_number, supplier_id, total, status, created_at "
                "FROM purchase_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50",
                tenant_id,
            )
            return [dict(r) for r in rows] if rows else []
        except Exception:
            return []

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action    = data["action"]
        tenant_id = data["tenant_id"]
        now       = datetime.now(timezone.utc)

        if action == "list":
            pos = await self._list_pos(tenant_id)
            return {"action": "list", "purchase_orders": pos, "count": len(pos),
                    "source": "supabase" if pos else "empty"}

        total      = self._calculate_total(data.get("items", []))
        po_number  = data.get("po_number") or await self._next_po_number(tenant_id)

        status_map = {"create": "pending_approval", "approve": "approved",
                      "send": "sent_to_supplier"}
        status = status_map[action]

        po = {
            "po_number":    po_number,
            "supplier_id":  data["supplier_id"],
            "items":        data.get("items", []),
            "items_count":  len(data.get("items", [])),
            "total":        total,
            "payment_terms": data["payment_terms"],
            "delivery_date": data.get("delivery_date"),
            "status":       status,
            "created_at":   now.isoformat(),
            "approver_required": "owner" if action == "create" else None,
        }

        await self._persist_po(tenant_id, po)

        email_result: Dict = {"sent": False, "reason": "not a send action"}
        if action == "send":
            supplier_email = str(data.get("supplier_email", "")).strip()
            if supplier_email:
                email_result = await self._send_po_email(supplier_email, po)
            else:
                email_result = {"sent": False, "reason": "supplier_email not provided"}

        po["email_delivery"] = email_result
        return po


purchase_orders = Agent30PurchaseOrders()
