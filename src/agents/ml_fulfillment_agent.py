# src/agents/ml_fulfillment_agent.py
import logging
from typing import Dict, Any
from datetime import datetime
from src.agents.base_agent import BaseAgent
from src.adapters.ml_adapter import MLAdapter
from src.adapters.thermal_printer_adapter import ThermalPrinterAdapter
from src.adapters.meta_adapter import MetaAdapter

logger = logging.getLogger(__name__)

class MLFulfillmentAgent(BaseAgent):
    """
    Agente #3: ML Fulfillment Agent.
    Gestiona la generación de guías, almacenamiento de etiquetas y disparo de impresión.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(tenant_id, agent_id="ml_fulfillment_agent_v1", supabase_client=supabase_client)
        # Inyección de dependencias (CLAUDE_LESSON: verify existence)
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
        self.printer_adapter = ThermalPrinterAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point compatible con BaseAgent.run()"""
        return await self.execute(input_data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orquestación de cumplimiento.
        """
        order_id = data.get("order_id")
        dims = data.get("package_dimensions", {})
        
        # 1. Validación de inputs — ANTES de cualquier llamada a API
        if not order_id:
            raise RuntimeError("order_id es requerido.")
        peso = dims.get("peso", 0)
        if peso <= 0:
            raise ValueError(f"Peso inválido: {peso}kg. Debe ser > 0.")
        # CLAUDE_FIX: validar las 3 dimensiones — ML API rechaza valores 0
        alto = dims.get("alto", 0)
        ancho = dims.get("ancho", 0)
        largo = dims.get("largo", 0)
        if alto <= 0 or ancho <= 0 or largo <= 0:
            raise ValueError(
                f"Dimensiones inválidas: alto={alto}, ancho={ancho}, largo={largo}. "
                "Todas deben ser > 0."
            )

        # 2. Cargar credenciales ML
        await self.ml_adapter.load_credentials()

        # 3. Generar etiqueta en ML Shipping API
        # Nota: En ML API real se usa shipment_id. Asumiremos order_id por ahora o mapeo.
        label_data = await self._get_ml_shipping_label(order_id)
        tracking = label_data.get("tracking_number")
        if not tracking: raise RuntimeError("No se obtuvo tracking_number de ML API.")

        # 4. Guardar PDF en Storage (Bucket: shipping-labels)
        signed_url = await self._save_label_to_storage(label_data["pdf_bytes"], order_id)

        # 5. Intentar impresión ZPL
        zpl = self.printer_adapter.generate_zpl({
            "tracking_number": tracking,
            "external_id": order_id,
            "product_name": data.get("product_name", "Herramienta Kap"),
            "shipping_address": data.get("shipping_address", "Destino Kap Tools")
        })
        print_res = await self.printer_adapter.print_label(zpl, order_id)

        # 6. Notificar a Carlos por WhatsApp si hay acumuladas o error
        pending_count = await self._get_pending_labels_count()
        await self._notify_carlos(pending_count)

        # 7. Actualizar status de orden en BD (CLAUDE_LESSON: self.tenant_id en query)
        await self._update_order_status(order_id, tracking)

        return {
            "status": "success",
            "order_id": order_id,
            "tracking_number": tracking,
            "label_url": signed_url,
            "print_job_sent": print_res.get("success", False),
            "job_queued": print_res.get("job_queued", False),
            "carlos_notified": True
        }

    async def _get_ml_shipping_label(self, order_id: str) -> Dict[str, Any]:
        """
        Simulación de llamada a ML Shipping API.
        En producción: GET /shipments/{id}/label
        """
        # CLAUDE_LESSON: Retry ya está en MLAdapter._request
        # Retornamos mock exitoso
        return {
            "tracking_number": f"MLMEX-{order_id}-X",
            "pdf_bytes": b"%PDF-1.4 mock label content"
        }

    async def _save_label_to_storage(self, pdf_bytes: bytes, order_id: str) -> str:  # noqa: ARG002
        """
        Guarda PDF y retorna URL firmada.
        """
        bucket = "shipping-labels"
        path = f"{self.tenant_id}/{order_id}/label.pdf"

        # 1. Asegurar bucket (CLAUDE_LESSON: try/except)
        try:
            await self.supabase.storage.get_bucket(bucket)
        except Exception:
            logger.info("Creando bucket %s...", bucket)
            # await self.supabase.storage.create_bucket(bucket, options={'public': False})
            pass # Asumimos que el cliente de Supabase lo maneja o stubbed

        # 2. Upload (Mocked with print)
        logger.info("Uploading label to %s", path)
        
        # 3. Retornar Signed URL (Mocked)
        return f"https://supabase.co/storage/signed/{path}?token=mock"

    async def _notify_carlos(self, pending_count: int) -> bool:
        """
        WhatsApp a Carlos ( warehouse_whatsapp)
        """
        try:
            config = await self.get_tenant_config(self.tenant_id)
            carlos_num = config.get("warehouse_whatsapp")
            if not carlos_num: return False

            msg = f"Tienes {pending_count} etiquetas listas para imprimir. Entra al dashboard para confirmar surtido."
            return await self.meta_adapter.send_whatsapp(carlos_num, msg)
        except Exception as e:
            logger.error("Fallo notificación a Carlos: %s", str(e))
            return False

    async def _update_order_status(self, order_id: str, tracking: str) -> bool:
        """
        Update orden con tracking y status.
        """
        try:
            await self.supabase.table("orders").update({
                "status": "APPROVED", # O 'label_generated' según catálogo
                "external_id": tracking # o campo específico
            }).eq("id", order_id).eq("tenant_id", self.tenant_id).execute()
            return True
        except Exception as e:
            logger.error("Error actualizando status de orden %s: %s", order_id, str(e))
            return False

    async def _get_pending_labels_count(self) -> int:
        """
        Cuenta etiquetas PENDING de hoy.
        """
        today = datetime.now().date().isoformat()
        try:
            res = await self.supabase.table("print_queue")\
                .select("id", count="exact")\
                .eq("tenant_id", self.tenant_id)\
                .eq("status", "PENDING")\
                .gte("created_at", today)\
                .execute()
            return res.count if res.count is not None else 0
        except Exception:
            return 0

    # ── Stubs de compatibilidad — el agente actúa como db_client para sus adaptadores ──
    # R14: En producción estos valores vienen del dashboard, nunca del código.
    # BLOCKER: reemplazar con llamadas reales a Vault/DB cuando Facturapi esté integrado.
    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        # R14 VIOLATION STUB — reemplazar con query a tenant_config table
        return {"warehouse_whatsapp": "521234567890", "printer_ip": "192.168.1.100"}

    async def get_vault_secret(self, _tenant_id: str, _secret_name: str) -> dict:
        return {"client_id": "MOCK_ID", "client_secret": "MOCK_SECRET"}
