"""Tests for Meta Router."""

import pytest
from src.routers.meta_router import MetaRouter


@pytest.fixture
def router():
    return MetaRouter()


@pytest.mark.asyncio
async def test_meta_router_send_whatsapp(router):
    result = await router.route({
        "intent": "send_message",
        "channel": "whatsapp",
        "tenant_id": "orthocardio",
        "data": {
            "action": "send",
            "phone": "+525512345678",
            "message": "Hola, tu pedido esta listo.",
        },
    })
    assert result["success"] is True
    assert result["router"] == "Meta Router"
    assert "WhatsApp" in result["agents_called"][0]
    assert "execution_time_ms" in result


@pytest.mark.asyncio
async def test_meta_router_send_instagram(router):
    result = await router.route({
        "intent": "send_message",
        "channel": "instagram",
        "data": {
            "action": "send",
            "instagram_id": "ig_user_123",
            "message": "Gracias por tu mensaje.",
        },
    })
    assert result["success"] is True
    assert "Instagram" in result["agents_called"][0]
    assert "message_id" in result["result"]


@pytest.mark.asyncio
async def test_meta_router_send_facebook(router):
    result = await router.route({
        "intent": "send_message",
        "channel": "facebook",
        "data": {
            "action": "send",
            "facebook_id": "fb_psid_456",
            "message": "En que podemos ayudarte?",
        },
    })
    assert result["success"] is True
    assert "Facebook" in result["agents_called"][0]


@pytest.mark.asyncio
async def test_meta_router_manage_ads(router):
    result = await router.route({
        "intent": "manage_ads",
        "tenant_id": "orthocardio",
        "data": {
            "action": "create",
            "campaign": {
                "name": "Promo Abril",
                "objective": "conversions",
                "platforms": ["facebook", "instagram"],
                "budget_daily": 500.0,
                "targeting": {"age_min": 25, "age_max": 55, "interests": ["salud"]},
            },
        },
    })
    assert result["success"] is True
    assert "Ads Manager" in result["agents_called"][0]
    assert "campaign_id" in result["result"]


@pytest.mark.asyncio
async def test_meta_router_publish_content(router):
    result = await router.route({
        "intent": "publish_content",
        "data": {
            "action": "publish",
            "content_type": "post",
            "platforms": ["instagram", "facebook"],
            "content": {
                "text": "Nuevo producto disponible",
                "media": [{"type": "image", "url": "https://cdn.example.com/img.jpg"}],
            },
        },
    })
    assert result["success"] is True
    assert "Content Publisher" in result["agents_called"][0]
    assert "posts" in result["result"]


@pytest.mark.asyncio
async def test_meta_router_invalid_intent(router):
    result = await router.route({"intent": "hack_ads", "data": {}})
    assert result["success"] is False
    assert "intent" in result["error"].lower() or "Unknown" in result["error"]


@pytest.mark.asyncio
async def test_meta_router_invalid_channel(router):
    result = await router.route({
        "intent": "send_message",
        "channel": "tiktok",
        "data": {"action": "send", "phone": "+525512345678", "message": "test"},
    })
    assert result["success"] is False
    assert "channel" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_meta_router_execution_time_present(router):
    result = await router.route({
        "intent": "manage_ads",
        "data": {
            "action": "list",
            "status": "active",
        },
    })
    assert "execution_time_ms" in result
    assert result["execution_time_ms"] >= 0
