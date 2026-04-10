# src/adapters/thermal_printer_adapter.py
import socket
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# ZPL special chars that corrupt label commands if unescaped
_ZPL_UNSAFE = str.maketrans({"^": "", "~": "", "&": "and"})


class ThermalPrinterAdapter:
    """
    Adaptador para impresoras térmicas (Zebra/ZPL).
    Maneja impresión directa vía TCP y gestión de cola en BD.
    """

    DEFAULT_PORT = 9100  # Usado como fallback si tenant_config no tiene printer_port

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db_client = db_client

    # ────────────────────────── PRINT ────────────────────────────────────── #

    async def print_label(self, zpl_content: str, order_id: str) -> Dict[str, Any]:
        """
        Intenta enviar ZPL directamente a la impresora vía TCP.
        Si falla, encola el trabajo — nunca bloquea el flujo principal.
        """
        try:
            config = await self.db_client.get_tenant_config(self.tenant_id)
            printer_ip = config.get("printer_ip")
            # CLAUDE_FIX: puerto desde tenant_config, no hardcodeado
            printer_port = int(config.get("printer_port", self.DEFAULT_PORT))
            protocol = config.get("printer_protocol", "ZPL")
        except Exception as e:
            # CLAUDE_FIX: loggear antes de swallow — antes era except Exception: sin log
            logger.error(
                "No se pudo cargar config de impresora para tenant=%s: %s",
                self.tenant_id, e,
            )
            printer_ip = None
            printer_port = self.DEFAULT_PORT
            protocol = "ZPL"

        if not printer_ip:
            logger.warning(
                "No hay IP de impresora configurada para tenant=%s. Encolando job.",
                self.tenant_id,
            )
            job_id = await self.queue_job(zpl_content, order_id, protocol)
            return {"success": False, "job_queued": True, "job_id": job_id}

        try:
            with socket.create_connection((printer_ip, printer_port), timeout=10) as sock:
                sock.sendall(zpl_content.encode("utf-8"))
                logger.info(
                    "Etiqueta enviada a impresora %s:%s (tenant=%s)",
                    printer_ip, printer_port, self.tenant_id,
                )
                return {"success": True, "ack": True}
        except (socket.timeout, ConnectionRefusedError, OSError) as e:
            logger.error(
                "Error conectando con impresora %s:%s: %s. Encolando job.",
                printer_ip, printer_port, e,
            )
            job_id = await self.queue_job(zpl_content, order_id, protocol)
            return {"success": False, "job_queued": True, "job_id": job_id}

    # ────────────────────────── QUEUE ────────────────────────────────────── #

    async def queue_job(self, content: str, order_id: str, protocol: str = "ZPL") -> str:
        """Guarda el trabajo en print_queue con self.tenant_id — nunca parámetro externo."""
        try:
            res = await (
                self.db_client.supabase.table("print_queue")
                .insert({
                    "tenant_id": self.tenant_id,  # R3: siempre self.tenant_id
                    "order_id": order_id,
                    "job_content": content,
                    "protocol": protocol,
                    "status": "PENDING",
                })
                .execute()
            )
            return res.data[0]["id"]
        except Exception as e:
            logger.error(
                "Fallo crítico al encolar job de impresión para tenant=%s: %s",
                self.tenant_id, e,
            )
            return "ERROR_DB"

    async def get_queue_status(self) -> List[Dict[str, Any]]:
        """Retorna jobs PENDING del tenant actual — usa self.tenant_id siempre."""
        try:
            res = await (
                self.db_client.supabase.table("print_queue")
                .select("*")
                .eq("tenant_id", self.tenant_id)  # R3
                .eq("status", "PENDING")
                .execute()
            )
            return res.data
        except Exception as e:
            logger.error("get_queue_status falló para tenant=%s: %s", self.tenant_id, e)
            return []

    # ────────────────────────── ZPL ──────────────────────────────────────── #

    def _escape_zpl_field(self, text: str) -> str:
        """
        SECURITY_FIX: escapa caracteres especiales ZPL antes de insertar en label.
        ^ inicia comandos ZPL, ~ inicia comandos alternativos — ambos corrompen la etiqueta.
        Un comprador con '^XZ' en su dirección cerraría el label prematuramente.
        """
        return text.translate(_ZPL_UNSAFE)

    def generate_zpl(self, order_data: Dict[str, Any]) -> str:
        """
        Genera código ZPL para Kap Tools.
        SECURITY_FIX: todos los campos de texto escapados con _escape_zpl_field().
        """
        # SECURITY_FIX: escapar ANTES de truncar para evitar truncar en medio de secuencia
        tracking = self._escape_zpl_field(order_data.get("tracking_number", "NO_TRACKING"))
        order_num = self._escape_zpl_field(order_data.get("external_id", "NO_ORDER"))
        product = self._escape_zpl_field(order_data.get("product_name", "Producto Kinexis"))[:25]
        destination = self._escape_zpl_field(
            order_data.get("shipping_address", "Consultar en App")
        )[:35]

        zpl = f"""^XA
^CI28
^FO50,50^A0N,40,40^FDORDER: {order_num}^FS
^FO50,100^A0N,30,30^FD{product}^FS
^FO50,150^A0N,25,25^FD{destination}^FS
^FO50,210^BY3
^BCN,100,Y,N,N
^FD{tracking}^FS
^FO550,50^A0N,20,20^FDKAP TOOLS^FS
^XZ"""
        return zpl

    # ────────────────────────── DIAGNOSTICS ──────────────────────────────── #

    async def test_connection(self) -> bool:
        """Ping básico a la impresora configurada."""
        try:
            config = await self.db_client.get_tenant_config(self.tenant_id)
            printer_ip = config.get("printer_ip")
            printer_port = int(config.get("printer_port", self.DEFAULT_PORT))
            if not printer_ip:
                return False
            with socket.create_connection((printer_ip, printer_port), timeout=2):
                return True
        except Exception:
            return False
