"""Agent #0 — Guardian (intent classifier + domain router)"""
import logging

logger = logging.getLogger(__name__)

_DOMAIN_KEYWORDS = {
    "ecommerce": [
        "mercado libre", "meli", "ml", "amazon", "fba", "shopify", "orden", "fulfillment",
        "producto", "precio", "devolución", "devolver", "stock canal", "venta online",
        "pregunta comprador", "pregunta ml", "listing",
    ],
    "erp": [
        "factura", "cfdi", "rfc", "sat", "timbrar", "inventario", "stock", "almacén",
        "proveedor", "compra", "orden de compra", "guía", "envío", "skydropx",
        "finanzas", "contabilidad", "cuentas por cobrar", "cuentas por pagar",
        "flujo de efectivo", "impresora", "etiqueta", "ticket",
    ],
    "crm": [
        "lead", "cliente", "prospecto", "cotización", "cotizar", "seguimiento",
        "nps", "satisfacción", "soporte", "ticket soporte", "queja", "reclamo",
        "pipeline", "oportunidad", "negociación", "cerrar venta", "b2b",
    ],
    "meta": [
        "whatsapp", "instagram", "facebook", "messenger", "publicar", "post",
        "story", "reel", "anuncio", "campaña", "ads", "meta ads", "dm", "mensaje",
    ],
}

_DOMAIN_ORDER = ["erp", "crm", "ecommerce", "meta"]


def _classify(query: str) -> str:
    q = query.lower()
    scores = {domain: 0 for domain in _DOMAIN_KEYWORDS}
    for domain, keywords in _DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                scores[domain] += 1
    best = max(scores, key=lambda d: scores[d])
    return best if scores[best] > 0 else "crm"


class GuardianAgent:
    name = "Guardian #0"

    async def execute(self, data: dict) -> dict:
        query = data.get("query", "")
        tenant_id = data.get("tenant_id")

        if not query:
            return {"success": False, "error": "query required", "data": {}}

        try:
            domain = _classify(query)
            intent = query[:120]

            return {
                "success": True,
                "data": {
                    "domain": domain,
                    "intent": intent,
                    "tenant_id": tenant_id,
                    "routing": f"→ {domain} router",
                    "confidence": "rule_based",
                },
            }
        except Exception as exc:
            logger.error("Guardian failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


guardian = GuardianAgent()
