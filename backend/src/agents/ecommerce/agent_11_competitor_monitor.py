"""
Agente #11: Competitor Price Monitor
Responsabilidad: Monitorear precios de competidores en MercadoLibre
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"check_prices", "get_alerts", "get_top_sellers"}


class Agent11CompetitorMonitor:
    """
    Competitor Monitor — Análisis de precios y competidores en ML.

    Input:
        {
            "action":    str  — check_prices | get_alerts | get_top_sellers
            "query":     str  — término de búsqueda / categoría
            "sku":       str  — (opcional) SKU propio para comparar
            "tenant_id": str
        }
    Output:
        { "action", "competitors": [...], "price_position", "alerts", "source" }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #11 - Competitor Monitor"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data.get("action", "check_prices")
        if action not in VALID_ACTIONS:
            action = "check_prices"
        return {
            "action": action,
            "query": str(data.get("query", "taladro")),
            "sku": data.get("sku"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Try real ML search API
        try:
            from src.utils.database import db
            creds = await db.fetch_one(
                "SELECT access_token FROM ml_credentials WHERE tenant_id=$1::uuid",
                data["tenant_id"],
            )
            if creds and creds.get("access_token"):
                return await self._fetch_competitors(creds["access_token"], data["query"], data["action"])
        except Exception as exc:
            logger.warning("%s real-data failed: %s — mock", self.name, exc)

        return self._mock_result(data["query"], data["action"])

    async def _fetch_competitors(self, token: str, query: str, action: str) -> Dict:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.mercadolibre.com/sites/MLM/search",
                params={"q": query, "limit": 10},
                headers={"Authorization": f"Bearer {token}"},
            )
        if resp.status_code != 200:
            return self._mock_result(query, action)

        results = resp.json().get("results", [])
        competitors = []
        prices = []
        for item in results[:10]:
            price = float(item.get("price", 0))
            prices.append(price)
            competitors.append({
                "title": item.get("title", "")[:60],
                "price": price,
                "sold_quantity": item.get("sold_quantity", 0),
                "seller_id": item.get("seller", {}).get("id"),
                "free_shipping": item.get("shipping", {}).get("free_shipping", False),
            })

        avg_price = sum(prices) / len(prices) if prices else 0
        min_price = min(prices) if prices else 0
        alerts = []
        if prices and min_price < avg_price * 0.75:
            alerts.append({"type": "warning", "message": f"Competidor con precio ${min_price:,.0f} — 25%+ bajo el promedio"})

        return {
            "action": action,
            "query": query,
            "competitors": competitors[:5],
            "market_avg_price": round(avg_price, 2),
            "market_min_price": round(min_price, 2),
            "price_position": "competitive" if avg_price > 0 else "unknown",
            "alerts": alerts,
            "source": "mercadolibre_api",
        }

    def _mock_result(self, query: str, action: str) -> Dict:
        return {
            "action": action, "query": query,
            "competitors": [
                {"title": "Taladro Percutor 850W Profesional",   "price": 1890.0, "sold_quantity": 234, "free_shipping": True},
                {"title": "Taladro Percutor Black+Decker 800W",  "price": 1650.0, "sold_quantity": 187, "free_shipping": True},
                {"title": "Taladro Bosch PSB 850-2 RE",          "price": 2200.0, "sold_quantity": 92,  "free_shipping": False},
                {"title": "Taladro Percutor Truper 800W",        "price": 1420.0, "sold_quantity": 310, "free_shipping": True},
            ],
            "market_avg_price": 1790.0,
            "market_min_price": 1420.0,
            "price_position": "competitive",
            "alerts": [{"type": "info", "message": "Truper tiene 310 ventas con precio 25% menor — revisar estrategia"}],
            "source": "mock_data",
        }
