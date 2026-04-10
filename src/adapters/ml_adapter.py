# src/adapters/ml_adapter.py
import os
import httpx
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, time
from tenacity import retry, stop_after_attempt, wait_exponential

class MLAdapter:
    """
    Adaptador de Mercado Libre para KINEXIS.
    Maneja OAuth, Webhooks y Operaciones de Mercado con Kap Tools.
    """
    AUTH_URL = "https://auth.mercadolibre.com.mx/authorization"
    TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
    API_BASE_URL = "https://api.mercadolibre.com"
    REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "https://api.kinexis.app/auth/callback/mercadolibre")
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.timeout = httpx.Timeout(30.0)
        # En producción, estas se cargarían desde Supabase Vault vía db_client
        self.client_id = os.getenv("ML_APP_ID", "2563941731044265")
        self.client_secret = os.getenv("ML_CLIENT_SECRET", "vDQxAUGDo4jwDmi4VEyLB5UoXQWe8TP7")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.1, min=0.1, max=1.0), reraise=True)
    async def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """
        Llamada base con retry logic y timeout.
        """
        url = f"{self.API_BASE_URL}{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Asegurar que el token es válido antes de la llamada
            await self._ensure_valid_token()
            
            headers = kwargs.get("headers", {})
            # headers["Authorization"] = f"Bearer {self.access_token}" # Se implementará con persistence layer
            
            response = await client.request(method, url, **kwargs)
            
            # Manejo específico Miércoles: publicaciones pausadas no es error
            if response.status_code == 403 and datetime.now().weekday() == 2:
                print("Nota: Miércoles de publicaciones pausadas (normal).")
            
            response.raise_for_status()
            return response.json()

    async def _ensure_valid_token(self):
        """
        Refresca el token si expira en < 5 minutos.
        """
        # Lógica de verificación con timestamp de BD (Placeholder)
        pass

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Renovación automática del access_token.
        """
        payload = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(self.TOKEN_URL, data=payload)
            resp.raise_for_status()
            return resp.json()

    async def get_orders(self, status: str = 'paid') -> List[Dict[str, Any]]:
        """
        Obtiene órdenes filtrando por el corte de las 9:00 AM.
        """
        now = datetime.now()
        cut_off = datetime.combine(now.date(), time(9, 0))
        
        # Filtro: desde las 9 AM del día anterior hasta las 9 AM de hoy (si ya pasó)
        # O desde las 9 AM de ayer hasta ahora si no ha pasado el corte.
        # Implementación simplificada
        path = f"/orders/search?seller=ME&order.status={status}"
        data = await self._request("GET", path)
        return data.get("results", [])

    async def get_questions(self, item_id: str) -> List[Dict[str, Any]]:
        return await self._request("GET", f"/questions/search?item={item_id}")

    async def post_answer(self, question_id: str, answer_text: str) -> Dict[str, Any]:
        payload = {"question_id": question_id, "text": answer_text}
        return await self._request("POST", "/answers", json=payload)

    async def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatcher de eventos hacia los Routers correspondientes.
        """
        topic = payload.get("topic")
        resource = payload.get("resource")
        
        mapping = {
            "orders_v2": "EcommerceRouter -> ML Question Handler",
            "messages": "EcommerceRouter -> ML Question Handler",
            "shipments": "EcommerceRouter -> ML Fulfillment Agent",
            "fbm_stock_operations": "ERPRouter -> Inventory Agent",
            "item_competition": "EcommerceRouter -> Price Sync Agent"
        }
        
        target = mapping.get(topic, "Unknown Domain")
        print(f"Webhook {topic} recibido. Ruteando a: {target}")
        
        return {"status": "dispatched", "target": target, "topic": topic}
