"""
Permission Validator - RBAC + RLS
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Fase 2: consultar BD real. Por ahora RBAC estatico.
_ROLE_PERMISSIONS: Dict[str, list] = {
    "owner":       ["*"],
    "admin":       ["ecommerce", "crm", "erp", "meta"],
    "agente":      ["crm", "ecommerce.read"],
    "almacenista": ["ecommerce", "erp.check_inventory", "erp.print_label", "erp.create_shipment"],
    "contador":    ["erp"],
}

# intent → modulo para lookup de permisos
_INTENT_MODULE: Dict[str, str] = {
    "sales_query":        "ecommerce",
    "fulfill_order":      "ecommerce",
    "update_price":       "ecommerce",
    "handle_return":      "ecommerce",
    "answer_question":    "ecommerce",
    "capture_lead":       "crm",
    "score_lead":         "crm",
    "generate_quote":     "crm",
    "follow_up":          "crm",
    "create_ticket":      "crm",
    "collect_nps":        "crm",
    "generate_cfdi":      "erp",
    "check_inventory":    "erp",
    "get_finance_snapshot": "erp",
    "evaluate_supplier":  "erp",
    "create_po":          "erp",
    "create_shipment":    "erp",
    "print_label":        "erp",
    "send_message":       "meta",
    "manage_ads":         "meta",
    "publish_content":    "meta",
}


class PermissionValidator:
    """Valida permisos RBAC por rol y modulo."""

    def __init__(self):
        self.name = "Permission Validator"

    async def validate(
        self,
        tenant_id: str,
        user_id: str,
        intent: str,
    ) -> Dict[str, Any]:
        """Valida si usuario puede ejecutar intent."""
        # TODO: resolver rol real desde BD usando tenant_id + user_id
        user_role = "owner"
        allowed = self._check_permission(user_role, intent)

        return {
            "allowed": allowed,
            "role": user_role,
            "tenant_id": tenant_id,
            "intent": intent,
        }

    def _check_permission(self, role: str, intent: str) -> bool:
        permissions = _ROLE_PERMISSIONS.get(role, [])

        if "*" in permissions:
            return True

        module = _INTENT_MODULE.get(intent, "unknown")
        specific = f"{module}.{intent}"

        for perm in permissions:
            if perm == module or perm == specific:
                return True

        return False


permission_validator = PermissionValidator()
