# src/agents/router_agent.py
from typing import Dict, Any
from src.agents.base_agent import BaseAgent

class RouterAgent(BaseAgent):
    """
    Agente #1: Router Agent.
    Orquestador principal que deriva tareas a los 4 sub-routers:
    EcommerceRouter, MetaRouter, ERPRouter, CRMRouter.
    """
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, agent_id="#1")

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Lógica de ruteo principal basado en el campo 'target_domain'.
        """
        domain = input_data.get("target_domain")
        payload = input_data.get("payload", {})

        if domain == "ecommerce":
            return await self.route_to_ecommerce(payload)
        elif domain == "meta":
            return await self.route_to_meta(payload)
        elif domain == "erp":
            return await self.route_to_erp(payload)
        elif domain == "crm":
            return await self.route_to_crm(payload)
        else:
            return {"error": f"Dominio desconocido: {domain}"}

    async def route_to_ecommerce(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Sub-router para Mercado Libre, Amazon, Shopify
        print(f"Routing to EcommerceRouter for tenant {self.tenant_id}")
        return {"sub_router": "EcommerceRouter", "status": "routed"}

    async def route_to_meta(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Sub-router para WhatsApp, Instagram, FB
        print(f"Routing to MetaRouter for tenant {self.tenant_id}")
        return {"sub_router": "MetaRouter", "status": "routed"}

    async def route_to_erp(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Sub-router para Facturación, Inventarios, Almacén
        print(f"Routing to ERPRouter for tenant {self.tenant_id}")
        return {"sub_router": "ERPRouter", "status": "routed"}

    async def route_to_crm(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Sub-router para Leads, Ventas B2B
        print(f"Routing to CRMRouter for tenant {self.tenant_id}")
        return {"sub_router": "CRMRouter", "status": "routed"}
