"""
Agente #29: Carrier Rate Comparator
Responsabilidad: Comparar tarifas y tiempos de entrega entre carriers
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Base rates per carrier (MXN, per shipment up to 1kg)
CARRIER_BASE: Dict[str, Dict] = {
    "estafeta": {"base": 65,  "per_kg": 10, "express_base": 100, "express_per_kg": 15, "days_standard": 5, "days_express": 2},
    "dhl":      {"base": 80,  "per_kg": 12, "express_base": 120, "express_per_kg": 18, "days_standard": 4, "days_express": 1},
    "fedex":    {"base": 90,  "per_kg": 12, "express_base": 140, "express_per_kg": 20, "days_standard": 4, "days_express": 1},
    "j&t":      {"base": 55,  "per_kg": 9,  "express_base": 85,  "express_per_kg": 13, "days_standard": 6, "days_express": 3},
    "paquetexpress": {"base": 60, "per_kg": 9, "express_base": 95, "express_per_kg": 14, "days_standard": 5, "days_express": 2},
}


def _calculate_rate(carrier_data: Dict, weight_kg: float, service: str) -> float:
    if service == "express":
        return carrier_data["express_base"] + carrier_data["express_per_kg"] * max(0, weight_kg - 1)
    return carrier_data["base"] + carrier_data["per_kg"] * max(0, weight_kg - 1)


class Agent29CarrierComparator:
    """
    Carrier Comparator — Comparación de tarifas de envío entre paqueterías.

    Input:
        {
            "weight_kg":     float  — Peso del paquete
            "destination":   str    — Ciudad/estado destino
            "service":       str    — standard | express
            "tenant_id":     str
        }
    Output:
        { "weight_kg", "service", "options": [...sorted by price...], "recommended", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #29 - Carrier Comparator"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = self._compare(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        weight = float(data.get("weight_kg", 1.0))
        service = data.get("service", "standard")
        if service not in ("standard", "express"):
            service = "standard"
        return {
            "weight_kg": max(0.1, weight),
            "destination": str(data.get("destination", "Ciudad de México")),
            "service": service,
            "tenant_id": str(data.get("tenant_id", "")),
        }

    def _compare(self, data: Dict) -> Dict:
        weight  = data["weight_kg"]
        service = data["service"]

        options = []
        for carrier, rates in CARRIER_BASE.items():
            cost = _calculate_rate(rates, weight, service)
            days = rates["days_express"] if service == "express" else rates["days_standard"]
            options.append({
                "carrier": carrier,
                "cost_mxn": round(cost, 2),
                "delivery_days": days,
                "service": service,
                "score": round((1 / cost) * 1000 / days, 3),  # price-speed composite
            })

        options.sort(key=lambda x: x["cost_mxn"])
        recommended = max(options, key=lambda x: x["score"])

        return {
            "weight_kg": weight,
            "destination": data["destination"],
            "service": service,
            "options": options,
            "recommended": recommended["carrier"],
            "cheapest": options[0]["carrier"],
            "fastest": min(options, key=lambda x: x["delivery_days"])["carrier"],
            "source": "local_rate_table",
        }
