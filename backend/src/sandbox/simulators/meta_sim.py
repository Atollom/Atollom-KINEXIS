"""
Meta Business API Simulator
Covers Graph API shapes for WhatsApp Business, Instagram Graph, and Facebook Pages.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

_TEMPLATE_NAMES = [
    "promocion_herramientas",
    "confirmacion_pedido",
    "recordatorio_carrito",
    "seguimiento_entrega",
    "cotizacion_b2b",
]
_POST_CAPTIONS = [
    "🔥 Oferta especial sandbox — Solo por hoy",
    "Nueva llegada: Herramienta profesional KAP 🛠️",
    "¿Sabías que nuestros productos tienen 2 años de garantía?",
    "Workshop gratuito: Aprende a usar tus herramientas",
]
_AD_OBJECTIVES = ["BRAND_AWARENESS", "LINK_CLICKS", "CONVERSIONS", "LEAD_GENERATION"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _past_iso(max_days: int = 30) -> str:
    delta = timedelta(days=random.randint(0, max_days))
    return (datetime.now(timezone.utc) - delta).isoformat()


class MetaSimulator:
    """Simulates Meta Graph API responses for WA / IG / FB."""

    # ── WhatsApp ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_wa_templates(waba_id: str) -> Dict[str, Any]:
        """Mirrors GET /{waba-id}/message_templates"""
        templates = []
        for name in _TEMPLATE_NAMES:
            templates.append(
                {
                    "id": str(random.randint(100_000_000_000_000, 999_999_999_999_999)),
                    "name": name,
                    "language": "es_MX",
                    "status": random.choices(
                        ["APPROVED", "PENDING", "REJECTED"], weights=[85, 10, 5]
                    )[0],
                    "category": random.choice(["MARKETING", "UTILITY"]),
                    "components": [
                        {"type": "HEADER", "format": "TEXT", "text": "Kap Tools"},
                        {"type": "BODY", "text": "Mensaje de plantilla sandbox."},
                        {"type": "FOOTER", "text": "Kap Tools MX"},
                    ],
                    "sandbox": True,
                }
            )
        return {"data": templates, "paging": {"cursors": {}}}

    @staticmethod
    def send_wa_message(phone: str, template_name: str, params: List[str]) -> Dict[str, Any]:
        """Mirrors POST /{phone-number-id}/messages"""
        return {
            "messaging_product": "whatsapp",
            "contacts": [{"input": phone, "wa_id": phone.replace("+", "")}],
            "messages": [{"id": f"wamid.sandbox.{random.randint(10_000_000, 99_999_999)}"}],
            "template_used": template_name,
            "params": params,
            "sandbox": True,
        }

    # ── Instagram ─────────────────────────────────────────────────────────────

    @staticmethod
    def get_ig_media(ig_user_id: str, limit: int = 20) -> Dict[str, Any]:
        """Mirrors GET /{ig-user-id}/media"""
        return {
            "data": [
                {
                    "id": str(random.randint(17_000_000_000_000_000, 17_999_999_999_999_999)),
                    "media_type": random.choice(["IMAGE", "CAROUSEL_ALBUM", "VIDEO"]),
                    "caption": random.choice(_POST_CAPTIONS),
                    "timestamp": _past_iso(30),
                    "permalink": f"https://www.instagram.com/p/sandbox{i:04d}/",
                    "like_count": random.randint(50, 900),
                    "comments_count": random.randint(5, 80),
                    "sandbox": True,
                }
                for i in range(min(limit, 20))
            ]
        }

    @staticmethod
    def get_ig_insights(ig_user_id: str) -> Dict[str, Any]:
        """Mirrors GET /{ig-user-id}/insights"""
        return {
            "data": [
                {"name": "impressions",    "period": "month", "values": [{"value": random.randint(80_000, 250_000)}]},
                {"name": "reach",          "period": "month", "values": [{"value": random.randint(60_000, 180_000)}]},
                {"name": "profile_views",  "period": "month", "values": [{"value": random.randint(2_000, 8_000)}]},
                {"name": "website_clicks", "period": "month", "values": [{"value": random.randint(500, 3_000)}]},
                {"name": "follower_count", "period": "lifetime", "values": [{"value": random.randint(8_000, 25_000)}]},
            ],
            "sandbox": True,
        }

    # ── Facebook ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_page_posts(page_id: str, limit: int = 10) -> Dict[str, Any]:
        """Mirrors GET /{page-id}/posts"""
        return {
            "data": [
                {
                    "id": f"{page_id}_{random.randint(1_000_000_000, 9_999_999_999)}",
                    "message": random.choice(_POST_CAPTIONS),
                    "created_time": _past_iso(30),
                    "likes": {"summary": {"total_count": random.randint(30, 500)}},
                    "comments": {"summary": {"total_count": random.randint(5, 80)}},
                    "shares": {"count": random.randint(2, 60)},
                    "sandbox": True,
                }
                for _ in range(min(limit, 10))
            ]
        }

    @staticmethod
    def get_ad_insights(ad_account_id: str) -> Dict[str, Any]:
        """Mirrors GET /{ad-account-id}/insights"""
        spend = round(random.uniform(500, 8_000), 2)
        impressions = random.randint(20_000, 200_000)
        clicks = random.randint(500, 5_000)
        conversions = random.randint(10, 120)
        return {
            "data": [
                {
                    "spend": str(spend),
                    "impressions": str(impressions),
                    "clicks": str(clicks),
                    "ctr": str(round(clicks / impressions * 100, 2)),
                    "cpc": str(round(spend / clicks, 2)),
                    "actions": [
                        {"action_type": "offsite_conversion", "value": str(conversions)}
                    ],
                    "cost_per_action_type": [
                        {"action_type": "offsite_conversion", "value": str(round(spend / conversions, 2))}
                    ],
                    "date_start": _past_iso(30)[:10],
                    "date_stop": _past_iso(0)[:10],
                }
            ],
            "sandbox": True,
        }
