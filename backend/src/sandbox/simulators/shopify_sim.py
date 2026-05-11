"""
Shopify GraphQL / REST Admin API Simulator
Mirrors response shapes from the Shopify Admin API 2024-01.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

_PRODUCT_TITLES = [
    "Taladro Percutor 800W",
    "Compresor de Aire 25L",
    "Sierra Circular 1400W",
    "Kit Destornilladores 32pz",
    "Lijadora Orbital 450W",
    "Nivel Láser 3 Líneas",
]
_FINANCIAL_STATUSES = ["pending", "authorized", "paid", "refunded", "voided"]
_FULFILLMENT_STATUSES = ["fulfilled", "partial", "unfulfilled", "restocked"]
_CARRIERS = ["FedEx", "DHL", "Estafeta", "Redpack"]


def _gid(resource: str) -> str:
    return f"gid://shopify/{resource}/{random.randint(1_000_000_000, 9_999_999_999)}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _past_iso(max_days: int = 30) -> str:
    delta = timedelta(days=random.randint(0, max_days), hours=random.randint(0, 23))
    return (datetime.now(timezone.utc) - delta).isoformat()


class ShopifySimulator:
    """Simulates Shopify Admin API responses."""

    @staticmethod
    def get_products(limit: int = 50) -> Dict[str, Any]:
        """Mirrors GET /admin/api/2024-01/products.json"""
        products = []
        for i in range(min(limit, 50)):
            title = random.choice(_PRODUCT_TITLES)
            base_price = round(random.uniform(299, 8999), 2)
            products.append(
                {
                    "id": random.randint(1_000_000_000, 9_999_999_999),
                    "title": title,
                    "handle": title.lower().replace(" ", "-"),
                    "status": random.choices(["active", "draft", "archived"], weights=[80, 15, 5])[0],
                    "variants": [
                        {
                            "id": random.randint(1_000_000_000, 9_999_999_999),
                            "title": color,
                            "price": str(base_price + random.randint(0, 200)),
                            "sku": f"KAP-{i:03d}-{color[:2].upper()}",
                            "inventory_quantity": random.randint(0, 150),
                            "fulfillment_service": "manual",
                        }
                        for color in random.sample(["Negro", "Azul", "Rojo", "Verde"], k=random.randint(1, 3))
                    ],
                    "images": [{"src": "/placeholder-product.jpg"}],
                    "created_at": _past_iso(90),
                    "updated_at": _past_iso(5),
                    "sandbox": True,
                }
            )
        return {"products": products}

    @staticmethod
    def get_orders(limit: int = 50) -> Dict[str, Any]:
        """Mirrors GET /admin/api/2024-01/orders.json"""
        orders = []
        for i in range(min(limit, 50)):
            orders.append(
                {
                    "id": random.randint(1_000_000_000, 9_999_999_999),
                    "name": f"#10{random.randint(10, 99)}",
                    "financial_status": random.choice(_FINANCIAL_STATUSES),
                    "fulfillment_status": random.choice(_FULFILLMENT_STATUSES),
                    "total_price": str(round(random.uniform(500, 15_000), 2)),
                    "currency": "MXN",
                    "line_items": [
                        {
                            "title": random.choice(_PRODUCT_TITLES),
                            "quantity": random.randint(1, 3),
                            "price": str(round(random.uniform(300, 5000), 2)),
                        }
                    ],
                    "shipping_address": {
                        "name": f"Cliente Sandbox {i + 1}",
                        "city": random.choice(["CDMX", "Guadalajara", "Monterrey", "Puebla"]),
                        "province": "México",
                        "country": "México",
                    },
                    "created_at": _past_iso(30),
                    "updated_at": _past_iso(2),
                    "sandbox": True,
                }
            )
        return {"orders": orders}

    @staticmethod
    def get_fulfillments(order_id: int) -> Dict[str, Any]:
        """Mirrors GET /admin/api/2024-01/orders/{id}/fulfillments.json"""
        carrier = random.choice(_CARRIERS)
        tracking = f"{carrier[:3].upper()}{random.randint(100_000_000, 999_999_999)}MX"
        return {
            "fulfillments": [
                {
                    "id": random.randint(1_000_000_000, 9_999_999_999),
                    "order_id": order_id,
                    "status": random.choice(["pending", "open", "success", "cancelled"]),
                    "tracking_company": carrier,
                    "tracking_number": tracking,
                    "tracking_url": f"https://track.{carrier.lower()}.com/{tracking}",
                    "created_at": _past_iso(5),
                    "updated_at": _now_iso(),
                    "sandbox": True,
                }
            ]
        }

    @staticmethod
    def get_analytics(period_days: int = 30) -> Dict[str, Any]:
        """Simulates Shopify Analytics: revenue, sessions, conversion."""
        daily = []
        base = datetime.now(timezone.utc)
        for d in range(period_days):
            day = base - timedelta(days=period_days - d)
            sessions = random.randint(150, 600)
            orders = random.randint(5, 30)
            daily.append(
                {
                    "date": day.date().isoformat(),
                    "sessions": sessions,
                    "orders": orders,
                    "revenue": round(orders * random.uniform(800, 3000), 2),
                    "conversion_rate": round(orders / sessions * 100, 2),
                }
            )
        return {"period_days": period_days, "daily": daily, "sandbox": True}
