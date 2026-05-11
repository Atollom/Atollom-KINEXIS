"""
Sandbox Manager — simulates external API integrations without real credentials.
All sync calls return realistic-looking data so the frontend behaves identically
to production, making it safe to demo without live API keys.
"""
import asyncio
import logging
import random
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

logger = logging.getLogger(__name__)

IntegrationName = Literal["mercadolibre", "amazon", "shopify", "meta"]

_RATE_LIMITS: Dict[IntegrationName, int] = {
    "mercadolibre": 1000,
    "amazon":        500,
    "shopify":      2000,
    "meta":         5000,
}


class IntegrationState:
    def __init__(self, name: IntegrationName) -> None:
        self.name = name
        self.status: Literal["connected", "error", "disconnected"] = "connected"
        self.last_sync: str = datetime.utcnow().isoformat()
        self.api_calls_today: int = 0
        self.rate_limit: int = _RATE_LIMITS[name]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "last_sync": self.last_sync,
            "api_calls_today": self.api_calls_today,
            "rate_limit": self.rate_limit,
        }

    def record_call(self) -> None:
        self.api_calls_today += 1
        self.last_sync = datetime.utcnow().isoformat()

    def reset(self) -> None:
        self.api_calls_today = 0
        self.status = "connected"


class SandboxManager:
    """
    Central registry for all sandboxed integrations.
    Exposes sync / webhook simulation that any router can call.
    """

    def __init__(self) -> None:
        self.mode: Literal["SANDBOX", "PRODUCTION"] = "SANDBOX"
        self._integrations: Dict[IntegrationName, IntegrationState] = {
            name: IntegrationState(name)  # type: ignore[arg-type]
            for name in _RATE_LIMITS
        }
        self._sync_log: List[Dict[str, Any]] = []

    # ── Public read-only ──────────────────────────────────────────────────────

    @property
    def integrations(self) -> Dict[str, Dict[str, Any]]:
        return {name: state.to_dict() for name, state in self._integrations.items()}

    def get_integration_status(self, integration: str) -> Dict[str, Any]:
        state = self._integrations.get(integration)  # type: ignore[arg-type]
        return state.to_dict() if state else {"status": "not_connected"}

    def get_sync_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._sync_log[-limit:]

    # ── Simulation actions ────────────────────────────────────────────────────

    async def sync_integration(
        self, integration: str, tenant_id: str
    ) -> Dict[str, Any]:
        """
        Simulates a full data pull from an external API.
        Includes a short artificial delay to mimic network latency.
        """
        state = self._integrations.get(integration)  # type: ignore[arg-type]
        if state is None:
            return {"success": False, "error": f"Unknown integration: {integration}"}

        if state.api_calls_today >= state.rate_limit:
            logger.warning("[SANDBOX] %s rate limit reached for tenant %s", integration, tenant_id)
            return {"success": False, "error": "Rate limit reached", "integration": integration}

        # Simulate network round-trip (0.3 – 1.2 s)
        await asyncio.sleep(random.uniform(0.3, 1.2))

        state.record_call()
        items = random.randint(10, 120)

        entry: Dict[str, Any] = {
            "integration": integration,
            "tenant_id": tenant_id,
            "synced_at": state.last_sync,
            "items_synced": items,
            "mode": self.mode,
            "success": True,
        }
        self._sync_log.append(entry)

        logger.info(
            "[SANDBOX] sync %s tenant=%s items=%d call#%d",
            integration, tenant_id, items, state.api_calls_today,
        )
        return entry

    async def simulate_webhook(
        self,
        integration: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Processes a simulated inbound webhook event.
        Returns a receipt the caller can forward to the frontend.
        """
        logger.info("[SANDBOX] webhook %s/%s", integration, event_type)
        receipt: Dict[str, Any] = {
            "success": True,
            "integration": integration,
            "event": event_type,
            "payload": payload,
            "received_at": datetime.utcnow().isoformat(),
            "mode": self.mode,
        }
        self._sync_log.append(receipt)
        return receipt

    def reset(self) -> None:
        """Resets all call counters. Does NOT change connection status."""
        for state in self._integrations.values():
            state.reset()
        self._sync_log.clear()
        logger.info("[SANDBOX] reset by owner")


# Module-level singleton — import this everywhere
sandbox = SandboxManager()
