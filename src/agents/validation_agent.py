# src/agents/validation_agent.py
import re
from typing import Dict, Any, List
from src.agents.base_agent import BaseAgent

class ValidationAgent(BaseAgent):
    """
    Agente #26: Validation Agent (DETERMINISTA).
    Valida todas las operaciones críticas de negocio sin usar LLM.
    """
    KAP_RFC = "KTO2202178K8"
    KAP_CP = "72973"

    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, agent_id="#26")

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta los 6 checks obligatorios.
        """
        checks = [
            self.check_json_schema(input_data),
            self.check_price_above_minimum(input_data),
            self.check_tenant_isolation(input_data),
            self.check_rfc_format(input_data),
            self.check_cfdi_total_positive(input_data),
            self.check_rate_limits(input_data)
        ]

        failed_checks = [c for c in checks if not c["is_passing"]]
        
        return {
            "is_passing": len(failed_checks) == 0,
            "failed_checks": failed_checks,
            "passed_count": len(checks) - len(failed_checks)
        }

    def check_json_schema(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Validación básica de estructura
        required_keys = ["source", "payload"]
        is_passing = all(k in data for k in required_keys)
        return {"check_name": "check_json_schema", "is_passing": is_passing}

    def check_price_above_minimum(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # R9 Reglas de márgenes: ML>=cost*1.20, AmazonFBA>=cost*1.25, Shopify>=cost*1.30, B2B>=cost*1.18
        payload = data.get("payload", {})
        platform = payload.get("platform")
        cost = payload.get("cost", 0)
        price = payload.get("price", 0)

        margins = {"ml": 1.20, "amazon": 1.25, "shopify": 1.30, "b2b": 1.18}
        min_margin = margins.get(platform, 1.20)
        
        is_passing = price >= (cost * min_margin) if cost > 0 else True
        return {"check_name": "check_price_above_minimum", "is_passing": is_passing}

    def check_tenant_isolation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # El tenant_id del input debe coincidir con el del agente
        input_tenant_id = data.get("tenant_id")
        is_passing = str(input_tenant_id) == str(self.tenant_id)
        return {"check_name": "check_tenant_isolation", "is_passing": is_passing}

    def check_rfc_format(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Valida formato de RFC y si es Kap Tools, valida contra el real
        rfc = data.get("payload", {}).get("rfc_emisor")
        if not rfc: return {"check_name": "check_rfc_format", "is_passing": True}
        
        # Regex estándar RFC
        rfc_regex = r"^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{3}$"
        is_passing = bool(re.match(rfc_regex, rfc))
        
        if rfc == self.KAP_RFC and is_passing:
            # Validación adicional de coincidencia con Kap Tools si aplica
            pass
            
        return {"check_name": "check_rfc_format", "is_passing": is_passing}

    def check_cfdi_total_positive(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # CFDI: nunca timbrar si total <= 0
        total = data.get("payload", {}).get("total", 0)
        is_passing = total > 0
        return {"check_name": "check_cfdi_total_positive", "is_passing": is_passing}

    def check_rate_limits(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Placeholder para control de ráfagas
        return {"check_name": "check_rate_limits", "is_passing": True}
