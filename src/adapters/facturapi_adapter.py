# src/adapters/facturapi_adapter.py
import asyncio
import logging
import os
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# Atollom master account key — usada solo para crear organizaciones nuevas.
# NUNCA se usa para emitir facturas de un tenant.
_FACTURAPI_USER_KEY: Optional[str] = os.environ.get("FACTURAPI_USER_KEY")

# ── Whitelists SAT como frozensets INMUTABLES (CLAUDE_FIX: antes eran list mutables) ──
FORMAS_PAGO_VALIDAS: frozenset = frozenset({
    "01", "02", "03", "04", "05", "06", "08",
    "12", "13", "14", "15", "17", "23", "24",
    "25", "26", "27", "28", "29", "30", "31", "99",
})
USOS_CFDI_VALIDOS: frozenset = frozenset({
    "G01", "G02", "G03", "I01", "I02", "I03",
    "I04", "I05", "I06", "I07", "I08",
    "D01", "D02", "D03", "D04", "D05", "D06",
    "D07", "D08", "D09", "D10", "S01", "CP01", "CN01",
})
MOTIVOS_CANCELACION: frozenset = frozenset({"01", "02", "03", "04"})

RFC_REGEX = re.compile(r"^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$")

# Regex para sanitizar SKUs — solo alfanumérico + guion/underscore
_SKU_SAFE = re.compile(r"[^A-Za-z0-9\-_]")

_CENTAVOS = Decimal("0.01")


class FacturapiAdapter:
    """
    Adaptador para servicios de facturación CFDI 4.0 vía Facturapi v2.
    Timeout de timbrado: 45s (SAT puede tardar). Resto: 30s estándar.
    """

    BASE_URL = "https://www.facturapi.io/v2"

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db_client = db_client
        self.timeout = httpx.Timeout(30.0)
        self.stamping_timeout = httpx.Timeout(45.0)  # Solo create_invoice

    # ───────────────────────── AUTH ──────────────────────────────────────── #

    async def _get_api_key(self) -> Optional[str]:
        """
        Carga la API key del tenant desde Supabase Vault.
        Precedencia: facturapi_live_key (org key) > facturapi_key (legacy).
        El cliente NUNCA configura FacturAPI directamente — Atollom aprovisiona
        la organización y guarda la org live key en vault como 'facturapi_live_key'.
        """
        try:
            secrets = await self.db_client.get_vault_secrets(
                self.tenant_id, ["facturapi_live_key", "facturapi_key"]
            )
            # Org key tiene prioridad (multi-org flow)
            return (
                secrets.get("facturapi_live_key")
                or secrets.get("facturapi_key")
                or None
            )
        except Exception as e:
            logger.warning(
                "Vault no disponible para facturapi keys tenant=%s: %s. Activando MOCK_MODE.",
                self.tenant_id, e,
            )
            return None

    # ───────────────────────── MULTI-ORG PROVISIONING ────────────────────── #

    @staticmethod
    async def create_organization(
        rfc: str,
        business_name: str,
        tax_regime: str,
        zip_code: str,
        db_client: Any,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Crea una organización FacturAPI en la cuenta Atollom (FACTURAPI_USER_KEY).
        Guarda el org_id en cfdi_tenant_config_ext y la live key en Supabase Vault.
        Solo Atollom llama esto — el cliente nunca toca FacturAPI directamente.

        Raises:
            RuntimeError: si FACTURAPI_USER_KEY no está configurado.
            ValueError: si RFC tiene formato inválido.
            httpx.HTTPStatusError: si FacturAPI rechaza la organización.
        """
        if not _FACTURAPI_USER_KEY:
            raise RuntimeError(
                "FACTURAPI_USER_KEY no configurado en env. "
                "Atollom debe tener su cuenta maestra de FacturAPI."
            )

        rfc_clean = rfc.upper().strip()
        if not RFC_REGEX.match(rfc_clean):
            raise ValueError(f"RFC con formato inválido para crear organización: {rfc_clean}")

        timeout = httpx.Timeout(30.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 1. Crear organización
            org_payload = {
                "name": business_name,
                "legal": {
                    "name": business_name,
                    "rfc": rfc_clean,
                    "tax_system": tax_regime,
                    "address": {"zip": zip_code},
                },
            }
            resp = await client.post(
                f"{FacturapiAdapter.BASE_URL}/organizations",
                json=org_payload,
                auth=(_FACTURAPI_USER_KEY, ""),
            )
            resp.raise_for_status()
            org_data = resp.json()
            org_id: str = org_data["id"]

            logger.info(
                "FacturAPI org creada: org_id=%s tenant_id=%s rfc=%s",
                org_id, tenant_id, rfc_clean,
            )

            # 2. Obtener las API keys de la organización (live key para producción)
            keys_resp = await client.get(
                f"{FacturapiAdapter.BASE_URL}/organizations/{org_id}/apikeys",
                auth=(_FACTURAPI_USER_KEY, ""),
            )
            keys_resp.raise_for_status()
            keys_data = keys_resp.json()
            live_key: Optional[str] = keys_data.get("live")

            if not live_key:
                logger.error(
                    "FacturAPI no devolvió live key para org_id=%s tenant_id=%s",
                    org_id, tenant_id,
                )
                raise RuntimeError(f"FacturAPI no devolvió live key para org {org_id}")

        # 3. Guardar org_id en cfdi_tenant_config_ext
        await db_client.upsert_cfdi_config(
            tenant_id=tenant_id,
            data={"facturapi_org_id": org_id},
        )

        # 4. Guardar live key en Supabase Vault (NUNCA en logs ni BD en claro)
        await db_client.save_vault_secret(
            tenant_id=tenant_id,
            key_name="facturapi_live_key",
            value=live_key,
        )

        logger.info(
            "FacturAPI org aprovisionada completa: tenant_id=%s org_id=%s",
            tenant_id, org_id,
        )

        return {"org_id": org_id, "status": "provisioned"}

    @staticmethod
    def _sanitize_sku(sku: str) -> str:
        """
        SECURITY_FIX: eliminar chars peligrosos del SKU antes de queries a BD.
        Previene path traversal (KIT../../../) y caracteres SQL/storage especiales.
        """
        return _SKU_SAFE.sub("", sku)

    # ───────────────────────── CLIENTES ──────────────────────────────────── #

    async def create_customer(
        self,
        rfc: str,
        name: str,
        email: str,
        zip_code: str,
        tax_regime: str,
    ) -> Dict[str, Any]:
        """
        Registra cliente en Facturapi. Valida RFC antes de la llamada.
        RFC XAXX010101000 → Público en General con datos Kap Tools.
        """
        rfc = rfc.upper().strip()
        if rfc == "XAXX010101000":
            name = "PUBLICO EN GENERAL"
            zip_code = "72973"
            tax_regime = "616"
        elif not RFC_REGEX.match(rfc):
            raise ValueError(f"RFC con formato inválido: {rfc}")

        api_key = await self._get_api_key()
        if not api_key:
            logger.warning("FACTURAPI_MOCK_MODE: create_customer para rfc=%s", rfc)
            return {"id": f"cust_mock_{uuid4()}", "legal_name": name, "tax_id": rfc}

        payload = {
            "legal_name": name,
            "tax_id": rfc,
            "tax_system": tax_regime,
            "email": email,
            "address": {"zip": zip_code},
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/customers", json=payload, auth=(api_key, "")
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Error Facturapi (Customer): %s", e.response.text)
                raise

    # ───────────────────────── FACTURA ───────────────────────────────────── #

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=15),
        reraise=True,
    )
    async def create_invoice(
        self,
        customer_id: str,
        items: List[Dict[str, Any]],
        payment_form: str,
        payment_method: str = "PUE",
        uso_cfdi: str = "G03",
    ) -> Dict[str, Any]:
        """
        Genera factura CFDI 4.0.
        Timeout extendido 45s (SAT puede tardar).
        Retry: 3 intentos, backoff 2s→4s→8s.
        """
        if not items:
            raise ValueError("Lista de productos vacía.")
        if payment_form not in FORMAS_PAGO_VALIDAS:
            raise ValueError(f"Forma de pago inválida: {payment_form}")
        if uso_cfdi not in USOS_CFDI_VALIDOS:
            raise ValueError(f"Uso de CFDI inválido: {uso_cfdi}")

        # Desglose de kits (R8)
        final_items = await self._breakdown_kits(items)

        # Validar total usando Decimal para evitar errores de redondeo
        total_sin_iva = sum(
            Decimal(str(it["price"])) * Decimal(str(it["quantity"]))
            for it in final_items
        )
        if total_sin_iva <= 0:
            raise ValueError(
                f"El total de la factura debe ser mayor a cero. Calculado: {total_sin_iva}"
            )

        api_key = await self._get_api_key()
        if not api_key:
            logger.warning(
                "FACTURAPI_MOCK_MODE: create_invoice para customer=%s", customer_id
            )
            return {
                "id": f"inv_mock_{uuid4()}",
                "uuid": f"MOCK-UUID-{uuid4()}",
                "status": "MOCK_TIMBRADO",
                "total": float(total_sin_iva * Decimal("1.16")),
                "created_at": "2026-04-10T00:00:00Z",
            }

        # SECURITY: whitelist de campos por item — ignorar campos extra del payload
        invoice_payload = {
            "customer": customer_id,
            "items": [
                {
                    "product": {
                        "description": it["description"],
                        "product_key": it["product_key"],
                        "price": float(
                            Decimal(str(it["price"])).quantize(_CENTAVOS, ROUND_HALF_UP)
                        ),
                        "tax_included": False,
                        "taxes": [{"type": "IVA", "rate": 0.16}],
                    },
                    "quantity": it["quantity"],
                }
                for it in final_items
            ],
            "payment_form": payment_form,
            "payment_method": payment_method,
            "use": uso_cfdi,
        }

        async with httpx.AsyncClient(timeout=self.stamping_timeout) as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/invoices", json=invoice_payload, auth=(api_key, "")
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Error Facturapi (Invoice): %s", e.response.text)
                raise

    # ───────────────────────── KITS ──────────────────────────────────────── #

    async def _breakdown_kits(
        self, items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        R8: Si un SKU es un kit, factura sus componentes — nunca el kit completo.
        CLAUDE_FIX: usa Decimal para división de precios (float da errores fiscales).
        CLAUDE_FIX: ajusta último componente para que la suma sea EXACTAMENTE igual al original.
        CLAUDE_FIX: nunca retorna price=0 en un componente.
        SECURITY_FIX: SKU sanitizado antes de query a BD.
        """
        processed = []
        for item in items:
            raw_sku = item.get("sku", "")
            sku = self._sanitize_sku(raw_sku)  # SECURITY_FIX

            if sku.startswith("KIT"):
                components = await self._get_kit_components_from_db(sku)
                if components:
                    n = len(components)
                    original_price = Decimal(str(item["price"]))

                    # CLAUDE_FIX: Decimal division con precisión centavos
                    unit_price = (original_price / n).quantize(_CENTAVOS, ROUND_HALF_UP)

                    # CLAUDE_FIX: nunca precio = 0
                    if unit_price <= Decimal("0"):
                        raise ValueError(
                            f"Kit {sku}: precio por componente calculado como 0 "
                            f"(precio original {item['price']}, {n} componentes)"
                        )

                    comp_items = []
                    for comp in components:
                        comp_items.append({
                            "description": f"{comp['name']} (Parte de {sku})",
                            "product_key": comp["sat_key"],
                            "price": float(unit_price),
                            "quantity": item["quantity"],
                        })

                    # CLAUDE_FIX: ajuste al último item para suma exacta
                    total_assigned = unit_price * (n - 1)
                    last_price = (original_price - total_assigned).quantize(
                        _CENTAVOS, ROUND_HALF_UP
                    )
                    if last_price <= Decimal("0"):
                        raise ValueError(
                            f"Kit {sku}: ajuste del último componente resultó en price<=0"
                        )
                    comp_items[-1]["price"] = float(last_price)
                    processed.extend(comp_items)
                else:
                    logger.warning(
                        "Kit %s sin componentes en BD — facturando kit completo (RIESGO FISCAL)",
                        sku,
                    )
                    processed.append(item)
            else:
                processed.append(item)
        return processed

    # ───────────────────────── ARCHIVOS ──────────────────────────────────── #

    async def download_files(self, invoice_id: str) -> Dict[str, bytes]:
        """Descarga XML y PDF en paralelo con asyncio.gather()."""
        api_key = await self._get_api_key()
        if not api_key:
            return {"xml": b"<mock>xml</mock>", "pdf": b"%PDF-mock"}

        auth = (api_key, "")
        async with httpx.AsyncClient(timeout=self.timeout) as client:

            async def get_xml() -> bytes:
                r = await client.get(
                    f"{self.BASE_URL}/invoices/{invoice_id}/xml", auth=auth
                )
                r.raise_for_status()
                return r.content

            async def get_pdf() -> bytes:
                r = await client.get(
                    f"{self.BASE_URL}/invoices/{invoice_id}/pdf", auth=auth
                )
                r.raise_for_status()
                return r.content

            xml_bytes, pdf_bytes = await asyncio.gather(get_xml(), get_pdf())
            return {"xml": xml_bytes, "pdf": pdf_bytes}

    # ───────────────────────── CANCELACIÓN ───────────────────────────────── #

    async def cancel_invoice(
        self,
        invoice_id: str,
        motivo: str,
        sustitucion_uuid: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Cancela factura con motivo SAT.
        Motivo '01' requiere sustitucion_uuid — validado antes de API.
        """
        if motivo not in MOTIVOS_CANCELACION:
            raise ValueError(f"Motivo de cancelación inválido: {motivo}")
        if motivo == "01" and not sustitucion_uuid:
            raise ValueError("El motivo '01' requiere un sustitucion_uuid.")

        api_key = await self._get_api_key()
        if not api_key:
            return {"status": "cancelled", "uuid": invoice_id, "mock": True}

        params: Dict[str, str] = {"motive": motivo}
        if sustitucion_uuid:
            params["substitution"] = sustitucion_uuid

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.delete(
                f"{self.BASE_URL}/invoices/{invoice_id}",
                params=params,
                auth=(api_key, ""),
            )
            resp.raise_for_status()
            return resp.json()

    async def create_payment_complement(self, *args, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError(
            "Complemento de Pago (REP) disponible en Fase 2. "
            "Usar metodo_pago=PUE para pagos en esta fase."
        )

    # ───────────────────────── DB HELPERS ────────────────────────────────── #

    async def _get_kit_components_from_db(self, _kit_sku: str) -> List[Dict[str, Any]]:
        """Placeholder — implementación real en CFDIBillingAgent._resolve_kits()."""
        return []
