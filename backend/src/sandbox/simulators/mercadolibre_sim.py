"""
Mercado Libre API Simulator
Mirrors the shape of real ML REST responses so frontend code needs zero changes
when switching from sandbox to production.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

_PRODUCT_NAMES = [
    "Taladro Percutor 800W",
    "Compresor de Aire 25L",
    "Sierra Circular 1400W",
    "Kit Destornilladores 32pz",
    "Lijadora Orbital 450W",
    "Nivel Láser 3 Líneas",
    "Rotomartillo 1100W",
    "Amoladora Angular 115mm",
    "Pistola de Silicón Eléctrica",
    "Medidor Láser Digital",
]

_LISTING_TYPES = ["gold_special", "gold_pro", "free", "classic"]
_ORDER_STATUSES = ["confirmed", "paid", "shipped", "delivered", "cancelled"]
_BUYER_NICKS = ["COMPRADOR_MX", "USUARIO_TEST", "CLIENTE_SANDBOX", "BUYER_DEMO"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _past_iso(max_days: int = 30) -> str:
    delta = timedelta(days=random.randint(0, max_days), hours=random.randint(0, 23))
    return (datetime.now(timezone.utc) - delta).isoformat()


class MLSimulator:
    """Simulates Mercado Libre API responses."""

    @staticmethod
    def get_products(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Mirrors GET /users/{user_id}/items/search"""
        return [
            {
                "id": f"MLM{random.randint(100_000_000, 999_999_999)}",
                "title": random.choice(_PRODUCT_NAMES),
                "price": round(random.uniform(199, 8999), 2),
                "currency_id": "MXN",
                "available_quantity": random.randint(0, 150),
                "sold_quantity": random.randint(0, 800),
                "status": random.choices(["active", "paused"], weights=[85, 15])[0],
                "listing_type_id": random.choice(_LISTING_TYPES),
                "health": round(random.uniform(0.6, 1.0), 2),
                "permalink": f"https://articulo.mercadolibre.com.mx/MLM-{i+1}-sandbox",
                "thumbnail": "/placeholder-product.jpg",
                "last_updated": _past_iso(5),
                "sandbox": True,
            }
            for i in range(min(limit, 50))
        ]

    @staticmethod
    def get_orders(seller_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Mirrors GET /orders/search?seller={id}"""
        return [
            {
                "id": random.randint(2_000_000_000_000, 2_999_999_999_999),
                "status": random.choice(_ORDER_STATUSES),
                "date_created": _past_iso(30),
                "date_closed": _past_iso(25),
                "total_amount": round(random.uniform(500, 15_000), 2),
                "currency_id": "MXN",
                "buyer": {
                    "id": random.randint(100_000_000, 999_999_999),
                    "nickname": f"{random.choice(_BUYER_NICKS)}_{i}",
                    "email": f"sandbox_buyer_{i}@kinexis.test",
                },
                "order_items": [
                    {
                        "item": {"title": random.choice(_PRODUCT_NAMES)},
                        "quantity": random.randint(1, 3),
                        "unit_price": round(random.uniform(300, 5000), 2),
                    }
                ],
                "sandbox": True,
            }
            for i in range(min(limit, 50))
        ]

    @staticmethod
    def get_questions(item_id: str) -> List[Dict[str, Any]]:
        """Mirrors GET /questions/search?item_id={id}"""
        count = random.randint(3, 12)
        questions = []
        for i in range(count):
            answered = random.choices([True, False], weights=[60, 40])[0]
            questions.append(
                {
                    "id": random.randint(1_000_000_000, 9_999_999_999),
                    "text": f"¿Pregunta sandbox #{i + 1} para el artículo {item_id}?",
                    "status": "ANSWERED" if answered else "UNANSWERED",
                    "date_created": _past_iso(2),
                    "answer": {
                        "text": f"Respuesta automática sandbox #{i + 1}.",
                        "date_created": _now_iso(),
                    }
                    if answered
                    else None,
                    "item_id": item_id,
                    "sandbox": True,
                }
            )
        return questions

    @staticmethod
    def get_metrics(seller_id: str) -> Dict[str, Any]:
        """Sales and visit KPIs — mirrors /users/{id}/classifieds/promotions"""
        return {
            "visits": random.randint(1_000, 15_000),
            "sales": random.randint(50, 500),
            "conversion_rate": round(random.uniform(1.5, 8.0), 2),
            "revenue": round(random.uniform(50_000, 500_000), 2),
            "avg_ticket": round(random.uniform(800, 4_000), 2),
            "seller_id": seller_id,
            "period": "last_30_days",
            "sandbox": True,
        }
