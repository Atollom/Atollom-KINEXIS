"""Tests for Content Publisher Agent."""

import pytest
from src.agents.meta.agent_content_publisher import AgentContentPublisher

VALID_CONTENT = {
    "text": "Nuevos productos en stock",
    "media": [{"type": "image", "url": "https://example.com/img.jpg"}],
}


@pytest.fixture
def agent():
    return AgentContentPublisher()


@pytest.mark.asyncio
async def test_content_publish_now(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "post",
        "platforms": ["facebook", "instagram"],
        "content": VALID_CONTENT,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["total_published"] == 2
    assert len(data["posts"]) == 2
    for post in data["posts"]:
        assert post["status"] == "published"
        assert post["post_id"] is not None


@pytest.mark.asyncio
async def test_content_schedule_future(agent):
    result = await agent.execute({
        "action": "schedule",
        "content_type": "post",
        "platforms": ["facebook"],
        "content": VALID_CONTENT,
        "scheduled_at": "2026-04-22T10:00:00Z",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "schedule"
    assert data["scheduled_at"] == "2026-04-22T10:00:00Z"
    for post in data["posts"]:
        assert post["status"] == "scheduled"


@pytest.mark.asyncio
async def test_content_publish_post_type(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "post",
        "platforms": ["facebook"],
        "content": {"text": "Post de prueba"},
    })
    assert result["success"] is True
    assert result["data"]["content_type"] == "post"


@pytest.mark.asyncio
async def test_content_publish_story_type(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "story",
        "platforms": ["instagram"],
        "content": VALID_CONTENT,
    })
    assert result["success"] is True
    assert result["data"]["content_type"] == "story"


@pytest.mark.asyncio
async def test_content_publish_facebook_only(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "post",
        "platforms": ["facebook"],
        "content": VALID_CONTENT,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["total_published"] == 1
    assert data["posts"][0]["platform"] == "facebook"
    assert "facebook.com" in data["posts"][0]["url"]


@pytest.mark.asyncio
async def test_content_publish_instagram_only(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "post",
        "platforms": ["instagram"],
        "content": VALID_CONTENT,
    })
    assert result["success"] is True
    assert result["data"]["posts"][0]["platform"] == "instagram"
    assert "instagram.com" in result["data"]["posts"][0]["url"]


@pytest.mark.asyncio
async def test_content_delete_scheduled(agent):
    result = await agent.execute({
        "action": "delete",
        "content_type": "post",
        "platforms": ["facebook"],
        "post_id": "FB-POST-001",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "delete"
    assert data["post_id"] == "FB-POST-001"
    assert data["status"] == "deleted"


@pytest.mark.asyncio
async def test_content_invalid_media_type(agent):
    result = await agent.execute({
        "action": "publish",
        "content_type": "post",
        "platforms": ["facebook"],
        "content": {
            "text": "Test",
            "media": [{"type": "audio", "url": "https://example.com/audio.mp3"}],
        },
    })
    assert result["success"] is False
    assert "media" in result["error"].lower() or "type" in result["error"].lower()


@pytest.mark.asyncio
async def test_content_schedule_missing_scheduled_at(agent):
    result = await agent.execute({
        "action": "schedule",
        "content_type": "post",
        "platforms": ["facebook"],
        "content": VALID_CONTENT,
    })
    assert result["success"] is False
    assert "scheduled_at" in result["error"].lower()
