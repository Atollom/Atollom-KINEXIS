"""
Agente #25: Skydrop Shipping
Responsabilidad: Generar guías de envío Skydropx (nacional/internacional)
Autor: Carlos Cortés (Atollom Labs)
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_CARRIERS = {"estafeta", "dhl", "fedex"}
VALID_SERVICES = {"standard", "express"}
REQUIRED_ADDRESS_FIELDS = {"name", "street", "city", "state", "zip", "phone"}

# Local cost estimator — used as fallback when Skydropx API is unavailable
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

# Origin warehouse ZIP (configurable via env)
ORIGIN_ZIP = os.getenv("WAREHOUSE_ZIP", "72000")
ORIGIN_ADDRESS = {
    "name":    os.getenv("COMPANY_NAME", "KINEXIS Almacén"),
    "street1": os.getenv("WAREHOUSE_STREET", "Av. Industrial 100"),
    "city":    os.getenv("WAREHOUSE_CITY", "Puebla"),
    "province": os.getenv("WAREHOUSE_STATE", "Puebla"),
    "zip":     ORIGIN_ZIP,
    "country": "MX",
    "phone":   os.getenv("WAREHOUSE_PHONE", "2221234567"),
    "email":   os.getenv("WAREHOUSE_EMAIL", "almacen@kinexis.mx"),
}


class Agent25SkydropShipping:
    """
    Skydrop Shipping — Generación de guías vía Skydropx API.

    Flujo real:
      1. get_rates(zip_from, zip_to, parcel, carriers=[carrier])
      2. Seleccionar rate por carrier + service_level
      3. create_shipment(rate_id, address_from, address_to, parcel)
      4. Retornar tracking_number + label_url

    Fallback local si API falla: calcula costo estimado sin tracking real.
    """

    REQUIRED_FIELDS = ["order_id", "carrier", "service_level", "package", "address"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #25 - Skydrop Shipping"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                "%s order=%s carrier=%s cost=%s tracking=%s",
                self.name, validated["order_id"], validated["carrier"],
                result.get("cost"), result.get("tracking_number"),
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
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
                f"package.weight {weight}kg exceeds {data['carrier']} max {rate_cfg['max_kg']}kg"
            )

        addr = data["address"]
        if not isinstance(addr, dict):
            raise ValueError("address must be a dict")
        missing = REQUIRED_ADDRESS_FIELDS - set(addr.keys())
        if missing:
            raise ValueError(f"address missing fields: {missing}")

        return data

    def _local_cost(self, carrier: str, service: str, weight: float) -> float:
        cfg = CARRIER_RATES[carrier][service]
        return round(cfg["base"] + cfg["per_kg"] * weight, 2)

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        carrier = data["carrier"]
        service = data["service_level"]
        pkg = data["package"]
        weight = float(pkg["weight"])
        cfg = CARRIER_RATES[carrier][service]
        addr = data["address"]

        # Build Skydropx-shaped address_to
        address_to = {
            "name":     addr.get("name", ""),
            "street1":  addr.get("street", ""),
            "city":     addr.get("city", ""),
            "province": addr.get("state", ""),
            "zip":      addr.get("zip", ""),
            "country":  addr.get("country", "MX"),
            "phone":    addr.get("phone", ""),
            "email":    addr.get("email", ""),
        }

        # Skydropx parcel format
        parcel = {
            "weight": weight,
            "height": float(pkg.get("height", 10)),
            "width":  float(pkg.get("width", 10)),
            "length": float(pkg.get("length", 10)),
        }

        try:
            from src.services.skydropx_service import skydropx_service

            # Step 1 — get rates filtered by carrier
            rates = await skydropx_service.get_rates(
                zip_from=ORIGIN_ZIP,
                zip_to=addr["zip"],
                parcel=parcel,
                carriers=[carrier],
            )

            # Step 2 — pick rate matching service_level (case-insensitive partial match)
            rate = next(
                (r for r in rates if service.lower() in (r.get("service_level") or "").lower()),
                rates[0] if rates else None,
            )
            if not rate:
                raise RuntimeError("No matching rate from Skydropx")

            rate_id = rate["rate_id"]

            # Step 3 — create shipment
            shipment = await skydropx_service.create_shipment(
                rate_id=rate_id,
                address_from=ORIGIN_ADDRESS,
                address_to=address_to,
                parcel=parcel,
                shopify_order_id=data.get("order_id"),
            )

            return {
                "shipment_id":        shipment.get("id"),
                "order_id":           data["order_id"],
                "carrier":            shipment.get("carrier") or carrier,
                "service_level":      service,
                "tracking_number":    shipment.get("tracking_number"),
                "tracking_url":       shipment.get("tracking_url"),
                "label_url":          shipment.get("label_url"),
                "cost":               shipment.get("price") or self._local_cost(carrier, service, weight),
                "weight_kg":          weight,
                "estimated_delivery": (datetime.now(timezone.utc) + timedelta(days=cfg["days"])).date().isoformat(),
                "estimated_days":     cfg["days"],
                "source":             "skydropx_api",
            }

        except Exception as api_err:
            logger.warning("%s Skydropx API unavailable (%s) — returning cost estimate", self.name, api_err)
            cost = self._local_cost(carrier, service, weight)
            delivery_date = (datetime.now(timezone.utc) + timedelta(days=cfg["days"])).date().isoformat()
            return {
                "shipment_id":        None,
                "order_id":           data["order_id"],
                "carrier":            carrier,
                "service_level":      service,
                "tracking_number":    None,
                "label_url":          None,
                "cost":               cost,
                "weight_kg":          weight,
                "estimated_delivery": delivery_date,
                "estimated_days":     cfg["days"],
                "source":             "local_estimate",
                "api_error":          str(api_err),
            }


skydrop_shipping = Agent25SkydropShipping()
