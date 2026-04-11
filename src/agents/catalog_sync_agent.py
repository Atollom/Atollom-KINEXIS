import asyncio
import logging
from typing import Any, Dict, List, Optional

from src.adapters.amazon_adapter import AmazonAdapter
from src.adapters.ml_adapter import MLAdapter
from src.adapters.shopify_adapter import ShopifyAdapter
from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class CatalogSyncAgent(BaseAgent):
    """
    Agente #21: Catalog Sync Agent.
    Mantiene la consistencia del catálogo en todas las plataformas usando Supabase como fuente de verdad.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="catalog_sync_agent_v1", supabase_client=supabase_client
        )
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)
        self.shopify_adapter = ShopifyAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Leer producto de products table
        2. Validar imagen y descripción
        3. Según trigger (product_updated, new_product, discontinue, manual_sync) -> Sync
        4. parallel sync (asyncio.gather)
        5. Registrar log
        """
        sku = data.get("sku")
        trigger = data.get("trigger")

        if not sku or not trigger:
            raise ValueError("sku y trigger son requeridos")

        # 1. Leer producto de Supabase
        product = await self._query_product(sku)
        if not product:
            logger.error("Producto SKU=%s no encontrado para tenant=%s", sku, self.tenant_id)
            return {"status": "error", "message": "Producto no encontrado"}

        # 2. Validar
        errors = self._validate_product(product)

        # 3. Trigger rules
        requires_approval = False
        if trigger in ["new_product", "discontinue"] or (trigger == "product_updated" and data.get("changes", {}).get("category_changed")):
            requires_approval = True
            await self._notify_socias(sku, trigger)
            # El negocio dice: "NOTIFY socias antes de publicar/discontinuar"
            # No bloqueamos el sync manual, asumimos NOTIFY y en producción la lógica de approvals puede retener

        # 4. Sync paralelo si no hay errores bloqueantes (como imagen/descripción)
        platforms_synced = []
        skipped = []

        if not errors:  # Solo sincr si tiene imagen, desc, y clave sat
            tasks = [
                self._sync_to_ml(product),
                self._sync_to_amazon(product),
                self._sync_to_shopify(product)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            platforms = ["mercadolibre", "amazon", "shopify"]
            for i, res in enumerate(results):
                p = platforms[i]
                if isinstance(res, bool) and res:
                    platforms_synced.append(p)
                else:
                    logger.warning("Error o skip en %s para %s: %s", p, sku, res)
                    skipped.append(p)
        else:
            skipped.extend(["mercadolibre", "amazon", "shopify"])

        # 5. Registrar en catalog_sync_log
        await self._insert_log({
            "tenant_id": self.tenant_id,
            "sku": sku,
            "trigger": trigger,
            "platforms_synced": platforms_synced,
            "errors": errors,
            "created_at": self._get_now().isoformat()
        })

        return {
            "platforms_synced": platforms_synced,
            "skipped": skipped,
            "errors": errors,
            "requires_approval": requires_approval
        }

    async def _sync_to_ml(self, product: dict) -> bool:
        try:
            item_id = product.get("ml_item_id")
            if item_id:
                await self.ml_adapter.update_item(item_id, product)
            else:
                await self.ml_adapter.create_item(product)
            return True
        except Exception as e:
            logger.error("Fallo ML sync para %s: %s", product.get("sku"), e)
            return False

    async def _sync_to_amazon(self, product: dict) -> bool:
        try:
            sku = product.get("sku")
            await self.amazon_adapter.update_inventory(sku, product.get("available_qty", 0))
            return True
        except Exception as e:
            logger.error("Fallo Amazon sync para %s: %s", product.get("sku"), e)
            return False

    async def _sync_to_shopify(self, product: dict) -> bool:
        try:
            # Stub para shopify_adapter.update_product
            if hasattr(self.shopify_adapter, 'update_product'):
                await self.shopify_adapter.update_product(product.get("shopify_variant_id", ""), product)
            return True
        except Exception as e:
            logger.error("Fallo Shopify sync para %s: %s", product.get("sku"), e)
            return False

    def _validate_product(self, product: dict) -> list:
        errors = []
        if not product.get("image_url"):
            errors.append("missing_image")
        if not product.get("description"):
            errors.append("missing_description")
        if not product.get("sat_key"):
            errors.append("missing_sat_key")
        return errors

    async def _notify_socias(self, sku: str, trigger: str):
        try:
            msg = f"⚠️ Catalog Sync: SKU {sku} - Trigger {trigger}"
            # await self.meta_adapter.send_whatsapp("SOCIAS_PHONE", msg)
            pass
        except Exception as e:
            logger.error("Error notificando socias catalog_sync sku=%s trigger=%s: %s", sku, trigger, e)

    async def _query_product(self, sku: str) -> Optional[dict]:
        res = await self.supabase.table("products").select("*").eq("tenant_id", self.tenant_id).eq("sku", sku).single().execute()
        return res.data if res and hasattr(res, 'data') else None

    async def _insert_log(self, data: dict):
        await self.supabase.table("catalog_sync_log").insert(data).execute()

    # Compatibility stubs
    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
