"""
Amazon Seller Central API Simulator
Mirrors SP-API response shapes.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

_PRODUCT_NAMES = [
    "Taladro Percutor 800W KAP",
    "Compresor 25L 2HP KAP",
    "Sierra Circular 1400W KAP",
    "Kit Destornilladores 32pz KAP",
    "Lijadora Orbital KAP",
]
_FULFILLMENT = ["AFN", "MFN"]  # FBA | FBM
_ORDER_STATUSES = ["Pending", "Unshipped", "Shipped", "Delivered", "Canceled"]
_CONDITION = ["New", "Used - Like New"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _past_iso(max_days: int = 30) -> str:
    delta = timedelta(days=random.randint(0, max_days))
    return (datetime.now(timezone.utc) - delta).isoformat()


class AmazonSimulator:
    """Simulates Amazon Selling Partner API responses."""

    @staticmethod
    def get_listings(seller_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Mirrors GET /listings/2021-08-01/items/{sellerId}"""
        return [
            {
                "sku": f"KAP-{random.randint(100, 999)}-{i:03d}",
                "asin": f"B{random.randint(10_000_000, 99_999_999):08d}",
                "fnsku": f"X{random.randint(10_000_000_000, 99_999_999_999)}",
                "product_name": random.choice(_PRODUCT_NAMES),
                "price": round(random.uniform(199, 9999), 2),
                "currency": "MXN",
                "quantity": random.randint(0, 200),
                "fulfillment_channel": random.choice(_FULFILLMENT),
                "status": random.choices(["Active", "Inactive"], weights=[88, 12])[0],
                "condition": random.choice(_CONDITION),
                "bsr": random.randint(100, 50_000),
                "last_updated": _past_iso(3),
                "sandbox": True,
            }
            for i in range(min(limit, 50))
        ]

    @staticmethod
    def get_orders(seller_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Mirrors GET /orders/v0/orders"""
        return [
            {
                "AmazonOrderId": f"303-{random.randint(1_000_000, 9_999_999)}-{random.randint(1_000_000, 9_999_999)}",
                "OrderStatus": random.choice(_ORDER_STATUSES),
                "PurchaseDate": _past_iso(30),
                "LastUpdateDate": _past_iso(2),
                "OrderTotal": {
                    "Amount": str(round(random.uniform(500, 12_000), 2)),
                    "CurrencyCode": "MXN",
                },
                "NumberOfItemsShipped": random.randint(0, 3),
                "NumberOfItemsUnshipped": random.randint(0, 2),
                "FulfillmentChannel": random.choice(_FULFILLMENT),
                "SalesChannel": "Amazon.com.mx",
                "sandbox": True,
            }
            for _ in range(min(limit, 50))
        ]

    @staticmethod
    def get_fba_inventory(seller_id: str) -> List[Dict[str, Any]]:
        """Mirrors GET /fba/inventory/v1/summaries"""
        return [
            {
                "sku": f"KAP-{random.randint(100, 999)}-FBA",
                "asin": f"B{random.randint(10_000_000, 99_999_999):08d}",
                "product_name": random.choice(_PRODUCT_NAMES),
                "fulfillable_quantity": random.randint(0, 300),
                "inbound_working_quantity": random.randint(0, 50),
                "inbound_shipped_quantity": random.randint(0, 30),
                "reserved_quantity": random.randint(0, 20),
                "researching_quantity": random.randint(0, 5),
                "last_updated": _now_iso(),
                "sandbox": True,
            }
            for _ in range(random.randint(5, 15))
        ]

    @staticmethod
    def get_fees(asin: str, price: float) -> Dict[str, Any]:
        """Mirrors GET /products/fees/v0/items/{Asin}/feesEstimate"""
        referral = round(price * random.uniform(0.08, 0.15), 2)
        fba = round(random.uniform(15, 80), 2)
        total = round(referral + fba, 2)
        return {
            "asin": asin,
            "price": price,
            "fees": {
                "ReferralFee": referral,
                "FBAFee": fba,
                "Total": total,
            },
            "net_revenue": round(price - total, 2),
            "margin_pct": round((price - total) / price * 100, 1),
            "sandbox": True,
        }
