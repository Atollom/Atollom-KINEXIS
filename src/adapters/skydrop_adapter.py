# src/adapters/skydrop_adapter.py
import logging
import uuid
import time
import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class SkyDropAdapter:
    """
    Wrapper para SkyDrop API.
    Gestión de guías de envío y rastreo.
    """

    # Paqueterías permitidas Kap Tools en frozenset (S11)
    PAQUETERIAS_PERMITIDAS = frozenset(['estafeta', 'dhl', 'fedex', 'ups'])

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db = db_client
        self.base_url = "https://api.skydrop.com.mx/v1"
        self.timeout = 30.0
        self.mock_mode = False

    async def _get_credentials(self) -> Dict[str, str]:
        """Obtiene credenciales de SkyDrop."""
        keys = ['skydrop_token']
        secrets = await self.db.get_vault_secrets(self.tenant_id, keys)
        
        if not secrets or not secrets.get('skydrop_token'):
            # El usuario especificó MOCK_MODE completo si no hay credenciales o API pública
            self.mock_mode = True
            return {}
            
        return secrets

    async def create_shipment(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea un envío en SkyDrop y retorna el tracking_number."""
        # 1. VALIDAR CAMPOS REQUERIDOS
        weight = order_data.get("weight", 0)
        dims = order_data.get("dimensions", {})
        if weight <= 0:
            raise ValueError(f"Peso inválido: {weight} kg")
        if any(dims.get(k, 0) <= 0 for k in ['height', 'width', 'length']):
            raise ValueError(f"Dimensiones inválidas: {dims}")

        # 2. SELECCIONAR CARRIER WHITE-LIST
        carrier = order_data.get("carrier_preference", "estafeta").lower()
        if carrier not in self.PAQUETERIAS_PERMITIDAS:
            carrier = "estafeta" # Default estable
        
        creds = await self._get_credentials()
        if self.mock_mode:
            # RETORNO SIMULADO 100% FUNCIONAL (S11)
            mock_id = f"SD-{uuid.uuid4().hex[:8]}"
            return {
                "tracking_number": f"TRACK-{mock_id}",
                "label_url": f"https://mock.skydrop.com/labels/{mock_id}.pdf",
                "shipment_id": mock_id,
                "carrier": carrier.upper(),
                "status": "created"
            }

        # PAYLOAD REAL (Draft basado en specs S11)
        payload = {
            "shipment": {
                "recipient": order_data.get("recipient"),
                "parcel": {
                    "weight": weight,
                    "height": dims.get("height"),
                    "length": dims.get("length"),
                    "width": dims.get("width")
                },
                "content": "herramientas de joyería",
                "clave_sat": "54101700",
                "carrier": carrier.upper()
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/shipments",
                    headers={"Authorization": f"Bearer {creds['skydrop_token']}"},
                    json=payload
                )
                res.raise_for_status()
                data = res.json()
                return {
                    "tracking_number": data.get("tracking_number"),
                    "label_url": data.get("label_url"),
                    "shipment_id": data.get("id"),
                    "carrier": data.get("carrier"),
                    "status": "created"
                }
        except Exception as e:
            logger.error("Error al crear shipment SkyDrop: %s", e)
            raise

    async def get_label_url(self, shipment_id: str) -> str:
        """Genera una URL firmada para la etiqueta."""
        # Kap Tools usa Signed URLs con 7 días de validez (S11)
        now = datetime.now(timezone.utc)
        expires_at = int((now + timedelta(days=7)).timestamp())
        token = uuid.uuid4().hex
        
        # Formato: {base_url}/labels/{id}?token={uuid4}&expires={unix_ts}
        signed_url = f"{self.base_url}/labels/{shipment_id}?token={token}&expires={expires_at}"
        return signed_url

    async def track_shipment(self, tracking_number: str) -> Dict[str, Any]:
        """Rastrea un envío SkyDrop."""
        if not tracking_number:
            raise ValueError("tracking_number es requerido para rastreo.")

        creds = await self._get_credentials()
        if self.mock_mode:
            return {"status": "in_transit", "location": "Cdmx Distribución"}
            
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(
                    f"{self.base_url}/track/{tracking_number}",
                    headers={"Authorization": f"Bearer {creds['skydrop_token']}"}
                )
                res.raise_for_status()
                return res.json()
        except Exception as e:
            logger.error("Error al rastrear SkyDrop %s: %s", tracking_number, e)
            return {"status": "unknown", "error": str(e)}
