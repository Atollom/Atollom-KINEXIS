import logging
import asyncio
from typing import Any, Dict, List
from decimal import Decimal

from src.adapters.ml_adapter import MLAdapter
from src.adapters.amazon_adapter import AmazonAdapter
from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ReviewMonitorAgent(BaseAgent):
    """
    Agente #28: Review Monitor Agent.
    Monitorea reseñas de ML y Amazon cada 4 horas.
    Alertas por rating bajo (<4.0) o patrones sospechosos de fakes.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="review_monitor_agent_v1", supabase_client=supabase_client
        )
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Según platform: leer reseñas de ML/Amazon
        2. Calcular rating promedio por SKU
        3. Detectar alertas de rating bajo
        4. Detectar patrones sospechosos
        5. Guardar snapshot
        """
        platform = data.get("platform", "all")
        
        results = {
            "reviews_checked": 0,
            "low_rating_alerts": [],
            "fake_review_alerts": [],
            "report_summary": {}
        }

        # 1. Obtener productos activos del tenant
        skus = await self._get_active_skus()
        
        # 2. Check reviews
        if platform in ["mercadolibre", "all"]:
            await self._check_ml_reviews(skus, results)
        
        if platform in ["amazon", "all"]:
            await self._check_amazon_reviews(skus, results)

        # 6. Notificar si hay alertas
        if results["low_rating_alerts"] or results["fake_review_alerts"]:
            await self._notify_socias(results)

        return results

    async def _get_active_skus(self) -> List[Dict[str, str]]:
        res = await self.supabase.table("products").select("sku, ml_id, amazon_asin").eq("tenant_id", self.tenant_id).eq("active", True).execute()
        return res.data if res and hasattr(res, 'data') else []

    async def _check_ml_reviews(self, skus: List[Dict], results: Dict):
        for item in skus:
            ml_id = item.get("ml_id")
            if not ml_id: continue
            
            try:
                # Simular llamada a ml_adapter.get_reviews(ml_id)
                reviews = await self._query_ml_reviews(ml_id)
                results["reviews_checked"] += len(reviews)
                
                analysis = await self._analyze_reviews(item["sku"], "mercadolibre", reviews)
                if analysis["low_rating"]:
                    results["low_rating_alerts"].append(f"ML: SKU {item['sku']} rating bajo ({analysis['rating']})")
                if analysis["fake_pattern"]:
                    results["fake_review_alerts"].append(f"ML: SKU {item['sku']} patrón sospechoso")
                
                await self._save_snapshot("mercadolibre", item["sku"], analysis)
            except Exception as e:
                logger.error("Error chequeando reseñas ML para %s: %s", ml_id, e)

    async def _check_amazon_reviews(self, skus: List[Dict], results: Dict):
        for item in skus:
            asin = item.get("amazon_asin")
            if not asin: continue
            
            try:
                reviews = await self.amazon_adapter.get_reviews(asin)
                results["reviews_checked"] += len(reviews)
                
                analysis = await self._analyze_reviews(item["sku"], "amazon", reviews)
                if analysis["low_rating"]:
                    results["low_rating_alerts"].append(f"AMZ: SKU {item['sku']} rating bajo ({analysis['rating']})")
                if analysis["fake_pattern"]:
                    results["fake_review_alerts"].append(f"AMZ: SKU {item['sku']} patrón sospechoso")
                
                await self._save_snapshot("amazon", item["sku"], analysis)
            except Exception as e:
                logger.error("Error chequeando reseñas Amazon para %s: %s", asin, e)

    async def _analyze_reviews(self, sku: str, platform: str, reviews: List[Dict]) -> Dict:
        if not reviews:
            return {"rating": 0.0, "count": 0, "low_rating": False, "fake_pattern": False}
        
        ratings = [r.get("rating", 0) for r in reviews]
        avg_rating = sum(ratings) / len(ratings)
        
        # Alerta < 4.0, Urgente < 3.8
        is_low = avg_rating < 4.0
        
        # Detectar patrones sospechosos
        is_fake = await self._detect_fake_pattern(reviews)
        
        return {
            "rating": round(avg_rating, 2),
            "count": len(reviews),
            "low_rating": is_low,
            "fake_pattern": is_fake
        }

    async def _detect_fake_pattern(self, reviews: List[Dict]) -> bool:
        """
        Señales de reseñas falsas:
          Muchas reseñas en < 24 horas (Simulado)
          Texto idéntico en múltiples reseñas
          Todos 5 estrellas sin texto
        """
        if len(reviews) < 3: return False
        
        # 1. Texto idéntico
        texts = [r.get("comment", "").strip().lower() for r in reviews if r.get("comment")]
        if len(texts) > 1 and len(set(texts)) <= len(texts) / 2:
            return True
            
        # 2. 5 estrellas sin texto (muchas)
        perfect_silent = [r for r in reviews if r.get("rating") == 5 and not r.get("comment")]
        if len(perfect_silent) > 5 and len(perfect_silent) > len(reviews) * 0.8:
            return True
            
        return False

    async def _save_snapshot(self, platform: str, sku: str, analysis: Dict):
        await self.supabase.table("review_snapshots").insert({
            "tenant_id": self.tenant_id,
            "platform": platform,
            "sku": sku,
            "avg_rating": analysis["rating"],
            "review_count": analysis["count"],
            "low_rating_alert": analysis["low_rating"],
            "fake_pattern_alert": analysis["fake_pattern"]
        }).execute()

    async def _notify_socias(self, alerts: Dict):
        msg = "Alerta de Reseñas:\n"
        if alerts["low_rating_alerts"]:
            msg += "\n".join(alerts["low_rating_alerts"])
        if alerts["fake_review_alerts"]:
            msg += "\n" + "\n".join(alerts["fake_review_alerts"])
            
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception as e:
            logger.error("Error notificando reseñas: %s", e)

    async def _query_ml_reviews(self, ml_id: str) -> List[Dict]:
        # Para tests y mock mode
        return []

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
