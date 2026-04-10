"""
KINEXIS — FacturapiAdapter
Adaptador para Facturapi v2 (PAC para CFDI 4.0)
https://www.facturapi.io/docs

Maneja: timbraje, cancelacion, consulta de status, descarga XML/PDF
Incluye: retry con backoff, manejo de errores SAT, validacion RFC
"""

import asyncio
import httpx
import logging
import re
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger("kinexis.cfdi.facturapi")


# ─── Enums ────────────────────────────────────────────────────────────────────

class CFDIType(str, Enum):
    INGRESO = "I"
    EGRESO  = "E"   # Nota de credito
    PAGO    = "P"   # Complemento de pago

class CFDIStatus(str, Enum):
    TIMBRADO              = "TIMBRADO"
    ERROR_PAC             = "ERROR_PAC"
    ERROR_VALIDACION      = "ERROR_VALIDACION"
    CANCELADO             = "CANCELADO"
    CANCELACION_PENDIENTE = "CANCELACION_PENDIENTE"


# ─── Modelos de Datos ─────────────────────────────────────────────────────────

@dataclass
class CFDILineItem:
    sku: str
    description: str
    quantity: float
    unit_price: float           # Precio unitario SIN IVA
    clave_sat: str              # Clave producto/servicio SAT
    clave_unidad_sat: str       # H87=pieza, KGM=kg, LTR=litro, etc.
    iva_rate: float = 0.16      # 16% estandar, 0.0 para exportacion


@dataclass
class CustomerData:
    rfc: str
    legal_name: str
    tax_regime: str             # Regimen fiscal del receptor
    zip_code: str               # CP del domicilio fiscal (CFDI 4.0 obligatorio)
    email: Optional[str] = None
    phone: Optional[str] = None


@dataclass
class CFDIRequest:
    customer: CustomerData
    items: list
                                # list[CFDILineItem]
    uso_cfdi: str               # Clave uso CFDI catalogo SAT
    forma_pago: str             # 01=Efectivo, 03=Transferencia, etc.
    metodo_pago: str            # PUE o PPD
    cfdi_type: CFDIType = CFDIType.INGRESO
    notes: Optional[str] = None
    cfdi_relacionado_uuid: Optional[str] = None
    order_id: Optional[str] = None


@dataclass
class CFDIResult:
    status: CFDIStatus
    uuid: Optional[str] = None
    folio: Optional[str] = None
    xml_url: Optional[str] = None
    pdf_url: Optional[str] = None
    facturapi_id: Optional[str] = None
    total: Optional[float] = None
    subtotal: Optional[float] = None
    iva: Optional[float] = None
    timbrado_at: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    requires_human_review: bool = False


# ─── Adapter Principal ────────────────────────────────────────────────────────

class FacturapiAdapter:
    """
    Adaptador para Facturapi v2.
    Maneja timbraje CFDI 4.0, cancelacion, descarga y validacion de RFC.

    Ejemplo de uso:
        adapter = FacturapiAdapter(
            api_key="sk_live_xxx",
            tenant_config={"regimen_fiscal": "601", "cp_expedicion": "72000"}
        )
        result = await adapter.create_invoice(cfdi_request)
    """

    BASE_URL = "https://www.facturapi.io/v2"
    MAX_RETRIES = 3
    RETRY_DELAYS = [2, 5, 15]   # Backoff exponencial en segundos

    def __init__(self, api_key: str, tenant_config: dict):
        self.api_key = api_key
        self.tenant_config = tenant_config
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                auth=(self.api_key, ""),        # Facturapi usa HTTP Basic Auth
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "KinexisAtollomNexus/3.0"
                },
                timeout=30.0
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ─── CREAR CFDI ──────────────────────────────────────────────────────────

    async def create_invoice(self, request: CFDIRequest) -> CFDIResult:
        """
        Timbra un CFDI 4.0 con reintentos automaticos.
        Retorna CFDIResult con UUID, URLs de descarga y status.
        """
        # 1. Validar RFC antes de intentar timbrar
        rfc_valid = await self.validate_rfc(request.customer.rfc)
        if not rfc_valid["valid"]:
            logger.warning(f"RFC invalido: {request.customer.rfc} — {rfc_valid['reason']}")
            return CFDIResult(
                status=CFDIStatus.ERROR_VALIDACION,
                error_code="RFC_INVALIDO",
                error_message=rfc_valid["reason"],
                requires_human_review=True
            )

        # 2. Construir payload para Facturapi
        payload = self._build_payload(request)

        # 3. Timbrar con reintentos
        for attempt, delay in enumerate(self.RETRY_DELAYS):
            try:
                client = await self._get_client()
                response = await client.post("/invoices", json=payload)

                if response.status_code == 200:
                    data = response.json()
                    logger.info(
                        f"CFDI timbrado | UUID: {data.get('uuid')} | "
                        f"Orden: {request.order_id}"
                    )
                    return self._parse_success_response(data)

                elif response.status_code == 400:
                    # Error de validacion — no tiene sentido reintentar
                    error = response.json()
                    logger.error(f"Error validacion CFDI: {error}")
                    return CFDIResult(
                        status=CFDIStatus.ERROR_VALIDACION,
                        error_code=error.get("code", "VALIDATION_ERROR"),
                        error_message=error.get("message", "Error de validacion SAT"),
                        requires_human_review=True
                    )

                elif response.status_code in [500, 502, 503]:
                    # Error del PAC — reintentar
                    logger.warning(
                        f"Error PAC (intento {attempt + 1}/{self.MAX_RETRIES}): "
                        f"HTTP {response.status_code}"
                    )
                    if attempt < self.MAX_RETRIES - 1:
                        await asyncio.sleep(delay)
                        continue
                    return CFDIResult(
                        status=CFDIStatus.ERROR_PAC,
                        error_code="PAC_UNAVAILABLE",
                        error_message=f"PAC no disponible despues de {self.MAX_RETRIES} intentos",
                        requires_human_review=True
                    )

            except httpx.TimeoutException:
                logger.warning(f"Timeout al timbrar (intento {attempt + 1})")
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(delay)

            except httpx.RequestError as e:
                logger.error(f"Error de conexion con Facturapi: {e}")
                return CFDIResult(
                    status=CFDIStatus.ERROR_PAC,
                    error_code="CONNECTION_ERROR",
                    error_message=str(e),
                    requires_human_review=True
                )

        return CFDIResult(
            status=CFDIStatus.ERROR_PAC,
            error_code="MAX_RETRIES_EXCEEDED",
            error_message="Se agotaron los reintentos de timbraje",
            requires_human_review=True
        )

    # ─── CANCELAR CFDI ───────────────────────────────────────────────────────

    async def cancel_invoice(
        self,
        facturapi_id: str,
        motivo: str = "02",
        cfdi_sustitucion: Optional[str] = None
    ) -> dict:
        """
        Cancela un CFDI ante el SAT.

        Motivos de cancelacion (catalogo SAT):
            01 = Comprobante emitido con errores CON relacion
            02 = Comprobante emitido con errores SIN relacion (el mas comun)
            03 = No se llevo a cabo la operacion
            04 = Operacion nominativa relacionada en la factura global
        """
        payload: dict = {"motivo": motivo}
        if cfdi_sustitucion and motivo == "01":
            payload["substitution"] = cfdi_sustitucion

        try:
            client = await self._get_client()
            response = await client.delete(
                f"/invoices/{facturapi_id}",
                json=payload
            )

            if response.status_code == 200:
                data = response.json()
                cancel_status = data.get("cancellation_status", "")
                logger.info(f"CFDI {facturapi_id} — estado: {cancel_status}")

                if cancel_status == "pending":
                    return {
                        "success": True,
                        "status": "CANCELACION_PENDIENTE",
                        "message": "El receptor debe aceptar la cancelacion en el portal del SAT"
                    }
                elif cancel_status in ["cancelled", "total_cancellation"]:
                    return {
                        "success": True,
                        "status": "CANCELADO",
                        "message": "CFDI cancelado exitosamente ante el SAT"
                    }
                else:
                    return {
                        "success": False,
                        "status": cancel_status,
                        "message": f"Estado inesperado del SAT: {cancel_status}"
                    }

            elif response.status_code == 404:
                return {"success": False, "status": "NOT_FOUND",
                        "message": "CFDI no encontrado en Facturapi"}
            else:
                error = response.json()
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": error.get("message", "Error desconocido al cancelar")
                }

        except httpx.RequestError as e:
            return {"success": False, "status": "CONNECTION_ERROR", "message": str(e)}

    # ─── DESCARGAR ARCHIVOS ───────────────────────────────────────────────────

    async def download_xml(self, facturapi_id: str) -> bytes:
        """Descarga el XML timbrado del CFDI."""
        client = await self._get_client()
        response = await client.get(f"/invoices/{facturapi_id}/xml")
        response.raise_for_status()
        return response.content

    async def download_pdf(self, facturapi_id: str) -> bytes:
        """Descarga la representacion impresa en PDF del CFDI."""
        client = await self._get_client()
        response = await client.get(f"/invoices/{facturapi_id}/pdf")
        response.raise_for_status()
        return response.content

    # ─── VALIDAR RFC ─────────────────────────────────────────────────────────

    async def validate_rfc(self, rfc: str) -> dict:
        """
        Valida formato RFC y consulta lista negra SAT (EFOS/LCO).
        Returns: {"valid": bool, "reason": str, "in_blacklist": bool}
        """
        # Validacion de formato local (rapida, sin llamada API)
        pattern_moral   = r'^[A-ZN&]{3}[0-9]{6}[A-Z0-9]{3}$'
        pattern_fisica  = r'^[A-ZN&]{4}[0-9]{6}[A-Z0-9]{3}$'
        pattern_publico = r'^XAXX010101000$'

        rfc_upper = rfc.upper().strip()
        if not (re.match(pattern_moral, rfc_upper) or
                re.match(pattern_fisica, rfc_upper) or
                re.match(pattern_publico, rfc_upper)):
            return {
                "valid": False,
                "reason": f"Formato de RFC invalido: {rfc}",
                "in_blacklist": False
            }

        # Consulta contra lista negra SAT via Facturapi
        try:
            client = await self._get_client()
            response = await client.get(f"/tools/tax_id/{rfc_upper}")
            if response.status_code == 200:
                data = response.json()
                in_blacklist = data.get("is_in_blacklist", False)
                return {
                    "valid": not in_blacklist,
                    "reason": "En lista negra SAT (EFOS)" if in_blacklist else "RFC valido",
                    "in_blacklist": in_blacklist,
                    "sat_data": data
                }
        except Exception as e:
            logger.warning(f"No se pudo consultar lista negra SAT: {e}. Validacion local OK.")

        return {
            "valid": True,
            "reason": "RFC con formato valido (lista negra SAT no consultada)",
            "in_blacklist": False
        }

    # ─── METODOS PRIVADOS ─────────────────────────────────────────────────────

    def _build_payload(self, request: CFDIRequest) -> dict:
        """Construye el payload JSON para la API de Facturapi v2."""
        items_payload = []
        for item in request.items:
            taxes = [{
                "type": "IVA",
                "rate": item.iva_rate,
                "factor": "Tasa",
                "withholding": False
            }]

            items_payload.append({
                "quantity": item.quantity,
                "product": {
                    "description": item.description,
                    "product_key": item.clave_sat,
                    "price": item.unit_price,
                    "unit_key": item.clave_unidad_sat,
                    "sku": item.sku,
                    "tax_included": False,
                    "taxes": taxes
                }
            })

        payload: dict = {
            "type": request.cfdi_type.value,
            "customer": {
                "legal_name": request.customer.legal_name,
                "tax_id": request.customer.rfc,
                "tax_system": request.customer.tax_regime,
                "address": {
                    "zip": request.customer.zip_code
                }
            },
            "items": items_payload,
            "use": request.uso_cfdi,
            "payment_form": request.forma_pago,
            "payment_method": request.metodo_pago,
            "currency": "MXN"
        }

        # Relacion para nota de credito o complemento de pago
        if request.cfdi_relacionado_uuid and request.cfdi_type in [
            CFDIType.EGRESO, CFDIType.PAGO
        ]:
            payload["related_documents"] = [{
                "uuid": request.cfdi_relacionado_uuid,
                "relationship": "01"  # Nota de credito
            }]

        if request.notes:
            payload["notes"] = request.notes

        return payload

    def _parse_success_response(self, data: dict) -> CFDIResult:
        """Parsea la respuesta exitosa de Facturapi."""
        return CFDIResult(
            status=CFDIStatus.TIMBRADO,
            uuid=data.get("uuid"),
            folio=str(data.get("folio_number", "")),
            facturapi_id=data.get("id"),
            total=data.get("total"),
            subtotal=data.get("subtotal"),
            timbrado_at=datetime.now(timezone.utc),
            requires_human_review=False
        )
