import logging
import json
from typing import Any, Dict, List
from src.agents.base_agent import BaseAgent
from src.adapters.ml_adapter import MLAdapter
from src.adapters.amazon_adapter import AmazonAdapter
from src.adapters.shopify_adapter import ShopifyAdapter
from src.adapters.meta_adapter import MetaAdapter

logger = logging.getLogger(__name__)

class OnboardingAgent(BaseAgent):
    """
    Agente #29: Onboarding Agent.
    Guía al nuevo tenant por 6 pasos críticos para estar operativo en < 30 min.
    Modo SUPERVISED.
    """

    STEPS = [
        'welcome', 'connect_platforms',
        'import_catalog', 'configure_rules',
        'activate_agents', 'complete'
    ]
    PROGRESS_MAP = {
        'welcome': 10, 'connect_platforms': 30,
        'import_catalog': 50, 'configure_rules': 70,
        'activate_agents': 90, 'complete': 100
    }

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="onboarding_agent_v1", supabase_client=supabase_client
        )
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)
        self.shopify_adapter = ShopifyAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta el paso actual del onboarding.
        """
        step = data.get("step")
        step_data = data.get("step_data", {})

        if not step or step not in self.STEPS:
            raise ValueError(f"Paso de onboarding inválido: {step}")

        # 1. Rutear al método del paso
        method_name = f"_step_{step}"
        if hasattr(self, method_name):
            result = await getattr(self, method_name)(step_data)
        else:
            result = {"step_completed": True, "blocking_issues": []}

        # 2. Calcular next_step y progreso
        curr_idx = self.STEPS.index(step)
        step_completed = result.get("step_completed", False)
        
        next_step = step
        onboarding_complete = False
        if step_completed and curr_idx < len(self.STEPS) - 1:
            next_step = self.STEPS[curr_idx + 1]
        elif step_completed and step == 'complete':
            onboarding_complete = True

        progress_pct = self.PROGRESS_MAP[next_step] if not onboarding_complete else 100

        # 3. Guardar progreso
        await self._upsert_progress(step, step_completed, next_step, progress_pct, result.get("blocking_issues", []))

        return {
            "step_completed": step_completed,
            "next_step": next_step,
            "progress_pct": progress_pct,
            "blocking_issues": result.get("blocking_issues", []),
            "onboarding_complete": onboarding_complete,
            "result_data": result.get("data", {})
        }

    async def _step_welcome(self, step_data: dict) -> dict:
        return {"step_completed": True, "blocking_issues": []}

    async def _step_connect_platforms(self, step_data: dict) -> dict:
        """
        Verificar conexión de cada plataforma. 
        Al menos una (ML, Amazon o Shopify) debe conectar.
        """
        connections = {}
        # ML ping
        try:
            ml_ok = await self.ml_adapter.get_orders(days_back=0)
            connections["mercadolibre"] = "connected"
        except Exception as e:
            logger.error("Onboarding ML connection failed tenant=%s: %s", self.tenant_id, e)
            connections["mercadolibre"] = "error"

        # Amazon ping
        try:
            amz_ok = await self.amazon_adapter.get_orders(days_back=0)
            connections["amazon"] = "connected"
        except Exception as e:
            logger.error("Onboarding Amazon connection failed tenant=%s: %s", self.tenant_id, e)
            connections["amazon"] = "error"

        # Shopify ping
        try:
            sh_ok = await self.shopify_adapter.get_orders()
            connections["shopify"] = "connected"
        except Exception as e:
            logger.error("Onboarding Shopify connection failed tenant=%s: %s", self.tenant_id, e)
            connections["shopify"] = "error"

        critical_ok = any(v == "connected" for k, v in connections.items() if k in ["mercadolibre", "amazon", "shopify"])
        
        issues = []
        if not critical_ok:
            issues.append("Ninguna plataforma crítica (ML/AMZ/SH) conectó. Revisa credenciales.")
            
        return {
            "step_completed": critical_ok,
            "blocking_issues": issues,
            "data": connections
        }

    async def _step_import_catalog(self, step_data: dict) -> dict:
        """
        Mapeo automático y carga de catálogo.
        """
        items = step_data.get("items", [])
        if not items:
            return {"step_completed": False, "blocking_issues": ["No hay items para importar"]}
        
        imported = []
        errors = []
        for item in items:
            sku = item.get("sku")
            if not sku:
                errors.append("Item sin SKU omitido")
                continue
            # Simple validation
            if not item.get("price") or not item.get("cost"):
                errors.append(f"SKU {sku} sin precio/costo omitido")
                continue
            imported.append(sku)
            # INSERT en products (mock)
            
        return {
            "step_completed": len(imported) > 0,
            "blocking_issues": errors[:5],
            "data": {"imported": len(imported), "errors": len(errors)}
        }

    async def _step_configure_rules(self, step_data: dict) -> dict:
        """
        Configurar reglas de negocio y CFDI obligatorio.
        """
        rfc = step_data.get("rfc")
        if not rfc:
            return {"step_completed": False, "blocking_issues": ["RFC obligatorio para facturación CFDI"]}
        
        return {"step_completed": True, "blocking_issues": []}

    async def _step_activate_agents(self, step_data: dict) -> dict:
        """
        Activar agentes en modo SUPERVISED.
        """
        # mock activate all
        await self.supabase.table("tenant_agent_config")\
            .update({"active": True, "autonomy_level": "SUPERVISED"})\
            .eq("tenant_id", self.tenant_id)\
            .execute()
            
        return {"step_completed": True, "blocking_issues": []}

    async def _step_complete(self, step_data: dict) -> dict:
        return {"step_completed": True, "blocking_issues": []}

    async def _upsert_progress(self, step, completed, next_s, pct, issues):
        # res = await self.supabase.table("onboarding_progress").select("*").eq("tenant_id", self.tenant_id).single().execute()
        # simplified upsert logic
        await self.supabase.table("onboarding_progress").upsert({
            "tenant_id": self.tenant_id,
            "current_step": next_s,
            "progress_pct": pct,
            "blocking_issues": issues
        }).execute()

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
