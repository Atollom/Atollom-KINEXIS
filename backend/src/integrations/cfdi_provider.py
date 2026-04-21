"""
CFDI Multi-Tenant Provider
Primary:  Facturama ($2,000 MXN/mes ilimitado, Profiles por RFC)
Fallback: FacturAPI (si Facturama falla)

Modelo multi-tenant:
- Una cuenta Atollom en Facturama/FacturAPI
- Cada tenant factura con su propio RFC via Profiles
- Control de cuota mensual por tenant (200 / 500 / 1000 / mes)
- Registro histórico en tabla cfdi_invoices

Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from typing import Any, Dict, List, Optional

from .facturama_integration import facturama_integration
from .facturapi_integration import facturapi_integration

logger = logging.getLogger(__name__)

_GENERIC_ITEMS = List[Dict[str, Any]]

# Mock fiscal config por tenant_id — Fase 2: query a PostgreSQL
_MOCK_FISCAL_CONFIGS: Dict[str, Dict[str, Any]] = {
    "tenant_over_quota": {
        "rfc": "KAP850101ABC",
        "razon_social": "Kap Tools SA de CV",
        "regimen_fiscal": "601",
        "codigo_postal": "72000",
        "invoice_limit": 1,
        "invoices_used": 1,
        "facturama_profile_id": None,
    },
}
_MOCK_FISCAL_CONFIG_DEFAULT = {
    "rfc": "KAP850101ABC",
    "razon_social": "Kap Tools SA de CV",
    "regimen_fiscal": "601",
    "codigo_postal": "72000",
    "invoice_limit": 500,
    "invoices_used": 127,
    "facturama_profile_id": None,
}


class CFDIProvider:
    """
    Proveedor CFDI multi-tenant con fallback dual.

    Para crear facturas sin tenant (legacy / agent #13 directo):
        await cfdi_provider.create_invoice(customer_rfc=..., ...)

    Para crear facturas con contexto de tenant:
        await cfdi_provider.create_invoice(tenant_id=..., customer_rfc=..., ...)
    """

    def __init__(self):
        self.primary = facturama_integration
        self.fallback = facturapi_integration
        self.name = "CFDI Dual Provider"
        self.stats = {
            "facturama_success": 0,
            "facturama_failed": 0,
            "facturapi_success": 0,
            "facturapi_failed": 0,
            "quota_exceeded": 0,
        }
        logger.info(f"{self.name} initialized")

    # ── Health ────────────────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """Prueba ambos proveedores."""
        primary_test = await self.primary.test_connection()
        fallback_test = await self.fallback.test_connection()
        return {
            "success": primary_test["success"] or fallback_test["success"],
            "primary": primary_test,
            "fallback": fallback_test,
            "stats": self.stats,
        }

    # ── Invoice creation ──────────────────────────────────────────────────────

    async def create_invoice(
        self,
        customer_rfc: str,
        customer_name: str,
        items: _GENERIC_ITEMS,
        payment_form: str = "03",
        payment_method: str = "PUE",
        use: str = "G03",
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Crea factura CFDI 4.0 con fallback automático.

        Cuando se proporciona tenant_id:
          - Obtiene RFC emisor desde config fiscal del tenant
          - Verifica cuota mensual antes de facturar
          - Usa create_invoice_for_rfc() en cada provider

        Sin tenant_id (comportamiento legacy):
          - Usa la cuenta principal de Facturama sin Profile específico
          - Sin verificación de cuota

        Args:
            customer_rfc:   RFC del receptor (cliente final)
            customer_name:  Razón social del receptor
            items:          Conceptos en formato genérico
            payment_form:   Clave SAT forma de pago (01-30)
            payment_method: PUE | PPD
            use:            Clave SAT uso CFDI (G01-P01)
            tenant_id:      ID del tenant emisor (activa modo multi-tenant)
        """
        if tenant_id:
            return await self._create_invoice_multi_tenant(
                tenant_id=tenant_id,
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=items,
                payment_form=payment_form,
                payment_method=payment_method,
                use=use,
            )
        return await self._create_invoice_legacy(
            customer_rfc=customer_rfc,
            customer_name=customer_name,
            items=items,
            payment_form=payment_form,
            payment_method=payment_method,
            use=use,
        )

    async def _create_invoice_multi_tenant(
        self,
        tenant_id: str,
        customer_rfc: str,
        customer_name: str,
        items: _GENERIC_ITEMS,
        payment_form: str,
        payment_method: str,
        use: str,
    ) -> Dict[str, Any]:
        """Flujo multi-tenant: config fiscal → cuota → provider con RFC emisor."""
        fiscal_config = await self._get_tenant_fiscal_config(tenant_id)
        if not fiscal_config:
            return {
                "success": False,
                "error": "Tenant fiscal configuration not found",
                "message": "Por favor completa tu configuración fiscal en Ajustes → Facturación",
            }

        if fiscal_config["invoices_used"] >= fiscal_config["invoice_limit"]:
            self.stats["quota_exceeded"] += 1
            remaining = 0
            used = fiscal_config["invoices_used"]
            limit = fiscal_config["invoice_limit"]
            logger.warning(f"Quota exceeded for tenant {tenant_id}: {used}/{limit}")
            return {
                "success": False,
                "error": "Monthly invoice quota exceeded",
                "message": f"Límite mensual de {limit} facturas alcanzado",
                "quota": {"limit": limit, "used": used, "remaining": remaining},
            }

        facturama_items = self._convert_to_facturama_format(items)
        facturapi_items = self._convert_to_facturapi_format(items)

        # Intento 1: Facturama con Profile del tenant
        try:
            logger.info(f"Multi-tenant invoice via Facturama: tenant={tenant_id} rfc={fiscal_config['rfc']}")
            result = await self.primary.create_invoice_for_rfc(
                issuer_rfc=fiscal_config["rfc"],
                issuer_name=fiscal_config["razon_social"],
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=facturama_items,
                payment_form=payment_form,
                payment_method=payment_method,
                cfdi_use=use,
            )
            if result["success"]:
                await self._save_invoice_to_db(tenant_id=tenant_id, fiscal_config=fiscal_config,
                                               customer_rfc=customer_rfc, customer_name=customer_name,
                                               result=result, payment_form=payment_form,
                                               payment_method=payment_method, cfdi_use=use)
                await self._increment_invoice_count(tenant_id)
                self.stats["facturama_success"] += 1
                logger.info(f"✅ Facturama multi-tenant OK: {result.get('uuid')}")
                return result
            self.stats["facturama_failed"] += 1
            logger.warning(f"Facturama multi-tenant failed: {result.get('error')}")
        except Exception as e:
            self.stats["facturama_failed"] += 1
            logger.error(f"Facturama multi-tenant exception: {e}")

        # Intento 2: FacturAPI fallback
        try:
            logger.warning(f"Multi-tenant fallback to FacturAPI: tenant={tenant_id}")
            result = await self.fallback.create_invoice_for_rfc(
                issuer_rfc=fiscal_config["rfc"],
                issuer_name=fiscal_config["razon_social"],
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=facturapi_items,
                payment_form=payment_form,
                payment_method=payment_method,
                use=use,
            )
            if result["success"]:
                await self._save_invoice_to_db(tenant_id=tenant_id, fiscal_config=fiscal_config,
                                               customer_rfc=customer_rfc, customer_name=customer_name,
                                               result=result, payment_form=payment_form,
                                               payment_method=payment_method, cfdi_use=use)
                await self._increment_invoice_count(tenant_id)
                self.stats["facturapi_success"] += 1
                logger.info(f"✅ FacturAPI multi-tenant fallback OK: {result.get('uuid')}")
            else:
                self.stats["facturapi_failed"] += 1
            return result
        except Exception as e:
            self.stats["facturapi_failed"] += 1
            logger.error(f"FacturAPI multi-tenant exception: {e}")
            return {
                "success": False,
                "provider": "none",
                "error": "Both CFDI providers failed",
                "details": str(e),
                "message": "No fue posible generar la factura. Contacta a soporte.",
            }

    async def _create_invoice_legacy(
        self,
        customer_rfc: str,
        customer_name: str,
        items: _GENERIC_ITEMS,
        payment_form: str,
        payment_method: str,
        use: str,
    ) -> Dict[str, Any]:
        """Flujo legacy sin tenant: usa cuenta principal sin Profile específico."""
        # Intento 1: Facturama
        try:
            logger.info("Creating invoice with Facturama (primary)")
            result = await self.primary.create_invoice(
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=self._convert_to_facturama_format(items),
                payment_form=payment_form,
                payment_method=payment_method,
                cfdi_use=use,
            )
            if result["success"]:
                self.stats["facturama_success"] += 1
                logger.info(f"Invoice created with Facturama: {result.get('uuid')}")
                return result
            self.stats["facturama_failed"] += 1
            logger.warning(f"Facturama returned failure: {result.get('error')}")
        except Exception as e:
            self.stats["facturama_failed"] += 1
            logger.error(f"Facturama exception: {e}")

        # Intento 2: FacturAPI
        try:
            logger.warning("Falling back to FacturAPI")
            result = await self.fallback.create_invoice(
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=self._convert_to_facturapi_format(items),
                payment_form=payment_form,
                payment_method=payment_method,
                use=use,
            )
            if result["success"]:
                self.stats["facturapi_success"] += 1
                logger.info(f"Invoice created with FacturAPI (fallback): {result.get('uuid')}")
            else:
                self.stats["facturapi_failed"] += 1
                logger.error(f"FacturAPI also failed: {result.get('error')}")
            return result
        except Exception as e:
            self.stats["facturapi_failed"] += 1
            logger.error(f"FacturAPI exception: {e}")
            return {
                "success": False,
                "provider": "none",
                "error": "Both CFDI providers failed",
                "details": str(e),
            }

    # ── Tenant management ─────────────────────────────────────────────────────

    async def get_tenant_invoice_usage(self, tenant_id: str) -> Dict[str, Any]:
        """
        Retorna uso de cuota mensual del tenant.

        Returns:
            {"limit": 500, "used": 127, "remaining": 373,
             "percentage": 25.4, "status": "ok"|"warning"|"critical"}
        """
        config = await self._get_tenant_fiscal_config(tenant_id)
        if not config:
            return {"limit": 0, "used": 0, "remaining": 0, "percentage": 0, "status": "unknown"}

        used = config["invoices_used"]
        limit = config["invoice_limit"]
        remaining = max(0, limit - used)
        pct = round(used / limit * 100, 1) if limit > 0 else 0
        status = "critical" if pct >= 95 else "warning" if pct >= 80 else "ok"

        return {
            "limit": limit,
            "used": used,
            "remaining": remaining,
            "percentage": pct,
            "status": status,
        }

    async def get_invoices_by_tenant(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lista facturas del tenant desde cfdi_invoices.

        Fase 2: SELECT * FROM cfdi_invoices WHERE tenant_id=... ORDER BY created_at DESC
        """
        logger.warning(f"MOCK: get_invoices_by_tenant({tenant_id}) — DB not connected")
        return []

    async def cancel_invoice(
        self,
        invoice_id: str,
        provider: str = "facturama",
        motive: str = "02",
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Cancela factura en el provider y actualiza status en BD.

        Fase 2: UPDATE cfdi_invoices SET status='cancelled', cancelled_at=NOW()
        """
        target = self.primary if provider == "facturama" else self.fallback
        result = await target.cancel_invoice(invoice_id, motive)
        if result["success"] and tenant_id:
            logger.warning(f"MOCK: Would update cfdi_invoices status=cancelled for {invoice_id}")
        return result

    # ── Read / Download ───────────────────────────────────────────────────────

    async def get_invoice(self, invoice_id: str, provider: str = "facturama") -> Dict[str, Any]:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.get_invoice(invoice_id)

    async def download_pdf(self, invoice_id: str, provider: str = "facturama") -> bytes:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.download_pdf(invoice_id)

    async def download_xml(self, invoice_id: str, provider: str = "facturama") -> bytes:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.download_xml(invoice_id)

    # ── Format converters ─────────────────────────────────────────────────────

    def _convert_to_facturama_format(self, items: _GENERIC_ITEMS) -> _GENERIC_ITEMS:
        """
        Formato genérico → Facturama.

        Input:  [{"description", "product_key", "quantity", "unit_price", ...}]
        Output: [{"ProductCode", "Description", "Quantity", "UnitPrice", "TaxObject", "Unit"}]
        """
        return [
            {
                "ProductCode": item.get("product_key", "01010101"),
                "Description": item.get("description", "Producto"),
                "Quantity": item.get("quantity", 1),
                "UnitPrice": item.get("unit_price", 0),
                "TaxObject": item.get("tax_object", "02"),
                "Unit": item.get("unit", "E48"),
            }
            for item in items
        ]

    def _convert_to_facturapi_format(self, items: _GENERIC_ITEMS) -> _GENERIC_ITEMS:
        """
        Formato genérico → FacturAPI.

        Output: [{"product": {"description", "product_key", "price"}, "quantity"}]
        """
        return [
            {
                "product": {
                    "description": item.get("description", "Producto"),
                    "product_key": item.get("product_key", "01010101"),
                    "price": item.get("unit_price", 0),
                },
                "quantity": item.get("quantity", 1),
            }
            for item in items
        ]

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """Estadísticas de uso de proveedores."""
        fs = self.stats["facturama_success"]
        ff = self.stats["facturama_failed"]
        rs = self.stats["facturapi_success"]
        rf = self.stats["facturapi_failed"]
        total_success = fs + rs
        total = total_success + ff + rf
        return {
            "total_invoices": total,
            "success_rate": round(total_success / total * 100, 2) if total else 0,
            "quota_exceeded_count": self.stats["quota_exceeded"],
            "facturama": {
                "success": fs,
                "failed": ff,
                "usage_rate": round(fs / total * 100, 2) if total else 0,
            },
            "facturapi": {
                "success": rs,
                "failed": rf,
                "usage_rate": round(rs / total * 100, 2) if total else 0,
            },
        }

    # ── Internal DB helpers (Phase 2: replace mocks with real queries) ────────

    async def _get_tenant_fiscal_config(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene config fiscal del tenant.
        Fase 2: SELECT * FROM tenant_fiscal_config WHERE tenant_id = $1
        """
        return _MOCK_FISCAL_CONFIGS.get(tenant_id, _MOCK_FISCAL_CONFIG_DEFAULT)

    async def _save_invoice_to_db(
        self,
        tenant_id: str,
        fiscal_config: Dict[str, Any],
        customer_rfc: str,
        customer_name: str,
        result: Dict[str, Any],
        payment_form: str,
        payment_method: str,
        cfdi_use: str,
    ) -> None:
        """
        Registra factura en cfdi_invoices.
        Fase 2: INSERT INTO cfdi_invoices (...) VALUES (...)
        """
        logger.warning(
            f"MOCK DB: Would INSERT cfdi_invoice uuid={result.get('uuid')} "
            f"tenant={tenant_id} provider={result.get('provider')}"
        )

    async def _increment_invoice_count(self, tenant_id: str) -> None:
        """
        Incrementa contador mensual del tenant.
        Fase 2: UPDATE tenant_fiscal_config
                SET invoices_used_current_month = invoices_used_current_month + 1
                WHERE tenant_id = $1
        """
        logger.warning(f"MOCK DB: Would increment invoice count for tenant {tenant_id}")


cfdi_provider = CFDIProvider()
