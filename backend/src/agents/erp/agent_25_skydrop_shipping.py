"""
Agente #25: Skydrop Shipping
Responsabilidad: Generar guías de envío Skydropx (nacional/internacional)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_CARRIERS = {"estafeta", "dhl", "fedex"}
VALID_SERVICES = {"standard", "express"}
REQUIRED_ADDRESS_FIELDS = {"name", "street", "city", "state", "zip", "phone"}

# Base rate + per-kg rate by carrier + service (MXN)
CARRIER_RATES: Dict[str, Dict[str, Dict[str, float]]] = {
    "estafeta": {
        "standard": {"base": 65.0,  "per_kg": 10.0, "max_kg": 70.0,  "days": 5},
        "express":  {"base": 100.0, "per_kg": 15.0, "max_kg": 70.0,  "days": 2},
    },
    "dhl": {
        "standard": {"base": 80.0,  "per_kg": 12.0, "max_kg": 300.0, "days": 4},
        "express":  {"base": 120.0, "per_kg": 18.0, "max_kg": 300.0, "days": 1},
    },
    "fedex": {
        "standard": {"base": 90.0,  "per_kg": 12.0, "max_kg": 150.0, "days": 4},
        "express":  {"base": 140.0, "per_kg": 20.0, "max_kg": 150.0, "days": 1},
    },
}


class Agent25SkydropShipping:
    """
    Skydrop Shipping — Generación de guías de envío vía Skydropx.

    Carriers: estafeta | dhl | fedex
    Servicios: standard | express

    Input:
        {
            "order_id":      str  — ID de la orden
            "carrier":       str  — estafeta | dhl | fedex
            "service_level": str  — standard | express
            "package":       dict — {weight, length, width, height}
            "address":       dict — {name, street, city, state, zip, phone}
        }

    Output:
        {
            "shipment_id":        str
            "carrier":            str
            "tracking_number":    str
            "label_url":          str
            "cost":               float
            "estimated_delivery": str — ISO date
        }
    """

    REQUIRED_FIELDS = ["order_id", "carrier", "service_level", "package", "address"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #25 - Skydrop Shipping"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea guía de envío."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} order={validated['order_id']} "
                f"carrier={validated['carrier']} cost={result.get('cost')}"
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["carrier"] not in VALID_CARRIERS:
            raise ValueError(f"Invalid carrier. Valid: {VALID_CARRIERS}")

        if data["service_level"] not in VALID_SERVICES:
            raise ValueError(f"Invalid service_level. Valid: {VALID_SERVICES}")

        pkg = data["package"]
        if not isinstance(pkg, dict):
            raise ValueError("package must be a dict")
        weight = float(pkg.get("weight", 0))
        if weight <= 0:
            raise ValueError("package.weight must be > 0")

        rate_cfg = CARRIER_RATES[data["carrier"]][data["service_level"]]
        if weight > rate_cfg["max_kg"]:
            raise ValueError(
                f"package.weight {weight}kg exceeds {data['carrier']} max "
                f"{rate_cfg['max_kg']}kg"
            )

        addr = data["address"]
        if not isinstance(addr, dict):
            raise ValueError("address must be a dict")
        missing = REQUIRED_ADDRESS_FIELDS - set(addr.keys())
        if missing:
            raise ValueError(f"address missing fields: {missing}")

        return data

    def _calculate_cost(self, carrier: str, service: str, weight: float) -> float:
        cfg = CARRIER_RATES[carrier][service]
        return round(cfg["base"] + cfg["per_kg"] * weight, 2)

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import skydropx
        client = skydropx.Client(api_key=os.getenv("SKYDROPX_API_KEY"))
        shipment = await client.shipments.create({...})
        """
        carrier = data["carrier"]
        service = data["service_level"]
        weight = float(data["package"]["weight"])
        cfg = CARRIER_RATES[carrier][service]
        cost = self._calculate_cost(carrier, service, weight)
        delivery_date = (datetime.now(timezone.utc) + timedelta(days=cfg["days"])).date().isoformat()
        order_id = data["order_id"]
        carrier_prefix = carrier[:3].upper()

        return {
            "shipment_id": None,
            "order_id": order_id,
            "carrier": carrier,
            "service_level": service,
            "tracking_number": None,
            "label_url": None,
            "cost": cost,
            "weight_kg": weight,
            "estimated_delivery": delivery_date,
            "estimated_days": cfg["days"],
            "note": "Skydropx API integration pending — Fase 2",
        }


skydrop_shipping = Agent25SkydropShipping()
