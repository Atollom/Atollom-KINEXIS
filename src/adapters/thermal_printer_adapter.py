# src/adapters/thermal_printer_adapter.py
import socket
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ThermalPrinterAdapter:
    """
    Adaptador para impresoras térmicas (Zebra/ZPL).
    Maneja impresión directa vía TCP y gestión de cola en BD.
    """

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db_client = db_client
        self.default_port = 9100

    async def print_label(self, zpl_content: str, order_id: str) -> Dict[str, Any]:
        """
        Intenta enviar el comando ZPL directamente a la impresora.
        Si falla, encola el trabajo automáticamente.
        """
        # 1. Obtener config de la impresora (IP, Protocolo)
        try:
            config = await self.db_client.get_tenant_config(self.tenant_id)
            printer_ip = config.get("printer_ip")
            protocol = config.get("printer_protocol", "ZPL")
        except Exception:
            printer_ip = None
            protocol = "ZPL"

        if not printer_ip:
            logger.warning("No hay IP de impresora configurada para tenant %s. Encolando job.", self.tenant_id)
            job_id = await self.queue_job(zpl_content, order_id, protocol)
            return {"success": False, "job_queued": True, "job_id": job_id}

        # 2. Intento de impresión vía Socket TCP
        try:
            with socket.create_connection((printer_ip, self.default_port), timeout=10) as sock:
                sock.sendall(zpl_content.encode('utf-8'))
                logger.info("Etiqueta enviada exitosamente a la impresora %s (Puerto 9100)", printer_ip)
                return {"success": True, "ack": True}
        except (socket.timeout, ConnectionRefusedError, OSError) as e:
            logger.error("Error conectando con impresora %s: %s. Encolando job.", printer_ip, str(e))
            job_id = await self.queue_job(zpl_content, order_id, protocol)
            return {"success": False, "job_queued": True, "job_id": job_id}

    async def queue_job(self, content: str, order_id: str, protocol: str = "ZPL") -> str:
        """
        Guarda el trabajo en la tabla print_queue de Supabase.
        """
        try:
            res = await self.db_client.supabase.table("print_queue").insert({
                "tenant_id": self.tenant_id,
                "order_id": order_id,
                "job_content": content,
                "protocol": protocol,
                "status": "PENDING"
            }).execute()
            return res.data[0]['id']
        except Exception as e:
            logger.error("Fallo crítico al encolar job de impresión en BD: %s", str(e))
            # No lanzamos excepción para no romper el flujo principal (CLAUDE_LESSON)
            return "ERROR_DB"

    def generate_zpl(self, order_data: Dict[str, Any]) -> str:
        """
        Genera el código ZPL para Kap Tools.
        """
        tracking = order_data.get("tracking_number", "NO_TRACKING")
        order_num = order_data.get("external_id", "NO_ORDER")
        product = order_data.get("product_name", "Producto Kinexis")[:25]
        destination = order_data.get("shipping_address", "Consultar en App")[:35]

        # Template ZPL Minimalista Premium
        zpl = f"""
^XA
^CI28
^FO50,50^A0N,40,40^FDORDER: {order_num}^FS
^FO50,100^A0N,30,30^FD{product}^FS
^FO50,150^A0N,25,25^FD{destination}^FS
^FO50,210^BY3
^BCN,100,Y,N,N
^FD{tracking}^FS
^FO550,50^A0N,20,20^FDKAP TOOLS^FS
^XZ
"""
        return zpl.strip()

    async def get_queue_status(self) -> List[Dict[str, Any]]:
        """
        Obtiene los trabajos pendientes del tenant.
        """
        try:
            res = await self.db_client.supabase.table("print_queue")\
                .select("*")\
                .eq("tenant_id", self.tenant_id)\
                .eq("status", "PENDING")\
                .execute()
            return res.data
        except Exception:
            return []

    async def test_connection(self) -> bool:
        """Ping básico a la impresora configurada."""
        try:
            config = await self.db_client.get_tenant_config(self.tenant_id)
            printer_ip = config.get("printer_ip")
            if not printer_ip: return False
            
            with socket.create_connection((printer_ip, self.default_port), timeout=2):
                return True
        except Exception:
            return False
