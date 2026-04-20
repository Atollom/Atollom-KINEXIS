"""
Agente #30: Purchase Orders
Responsabilidad: Crear y gestionar órdenes de compra automáticas
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"create", "approve", "send"}
VALID_PAYMENT_TERMS = {"30_days", "60_days", "immediate", "consignment"}

# PO number counter — Fase 2: from Supabase sequence
_PO_COUNTER = 42


def _next_po_number() -> str:
    global _PO_COUNTER
    _PO_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"PO-{year}-{_PO_COUNTER:03d}"


class Agent30PurchaseOrders:
    """
    Purchase Orders — Generación y aprobación de órdenes de compra.

    Flujo:
      create  → Genera OC en estado pending_approval
      approve → Cambia estado a approved (requiere rol owner/admin)
      send    → Marca como sent_to_supplier (dispara email en Fase 2)

    Input:
        {
            "action":         str  — create | approve | send
            "supplier_id":    str
            "items":          list — [{sku, description, quantity, unit_price}]
            "delivery_date":  str  — ISO date (YYYY-MM-DD)
            "payment_terms":  str  — 30_days | 60_days | immediate | consignment
        }

    Output:
        {
            "po_number":        str
            "supplier_id":      str
            "total":            float
            "status":           str — pending_approval | approved | sent_to_supplier
            "approver_required": str
        }
    """

    REQUIRED_FIELDS = ["action", "supplier_id", "items"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #30 - Purchase Orders"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea o actualiza una orden de compra."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} action={validated['action']} "
                f"supplier={validated['supplier_id']} total={result.get('total')}"
            )
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

        supplier_id = str(data["supplier_id"]).strip()
        if not supplier_id:
            raise ValueError("supplier_id cannot be empty")
        data["supplier_id"] = supplier_id

        items = data["items"]
        if not isinstance(items, list) or len(items) == 0:
            raise ValueError("items must be non-empty list")

        for i, item in enumerate(items):
            if "sku" not in item:
                raise ValueError(f"items[{i}] missing sku")
            qty = int(item.get("quantity", 0))
            if qty <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
            price = float(item.get("unit_price", 0))
            if price < 0:
                raise ValueError(f"items[{i}] unit_price must be >= 0")

        payment_terms = data.get("payment_terms", "30_days")
        if payment_terms not in VALID_PAYMENT_TERMS:
            raise ValueError(f"Invalid payment_terms. Valid: {VALID_PAYMENT_TERMS}")
        data["payment_terms"] = payment_terms

        return data

    def _calculate_total(self, items: list) -> float:
        return round(
            sum(float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items),
            2,
        )

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Persist PO to Supabase (table: purchase_orders)
        - Send PO email to supplier via SendGrid/Resend
        - Notify Agent #5 Inventory Monitor on receive
        - Require RBAC approval flow (owner signature)
        """
        action = data["action"]
        total = self._calculate_total(data["items"])

        if action == "create":
            po_number = _next_po_number()
            status = "pending_approval"
            approver = "owner"
        elif action == "approve":
            po_number = data.get("po_number", _next_po_number())
            status = "approved"
            approver = None
        else:  # send
            po_number = data.get("po_number", _next_po_number())
            status = "sent_to_supplier"
            approver = None

        return {
            "po_number": po_number,
            "supplier_id": data["supplier_id"],
            "items_count": len(data["items"]),
            "total": total,
            "payment_terms": data["payment_terms"],
            "delivery_date": data.get("delivery_date"),
            "status": status,
            "approver_required": approver,
            "note": "Supabase persistence & supplier email integration pending — Fase 2",
        }


purchase_orders = Agent30PurchaseOrders()
