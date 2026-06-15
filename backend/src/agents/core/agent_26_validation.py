"""Agent #26 — Validation (response quality gate)"""
import logging

logger = logging.getLogger(__name__)

_PLACEHOLDER_MARKERS = [
    "pending", "not implemented", "stub", "todo", "lorem ipsum",
    "coming soon", "placeholder", "hardcoded",
]


class ValidationAgent:
    name = "Validation #26"

    async def execute(self, data: dict) -> dict:
        agent_response = data.get("agent_response", {})

        issues = []

        if not isinstance(agent_response, dict):
            issues.append("Response is not a dict")
        else:
            if "success" not in agent_response:
                issues.append("Missing 'success' field")
            if "data" not in agent_response:
                issues.append("Missing 'data' field")
            if not agent_response.get("success"):
                error_msg = str(agent_response.get("error", "")).lower()
                for marker in _PLACEHOLDER_MARKERS:
                    if marker in error_msg:
                        issues.append(f"Stub response detected: '{marker}'")
                        break

        return {
            "success": True,
            "data": {
                "valid": len(issues) == 0,
                "issues": issues,
                "original_success": agent_response.get("success", False) if isinstance(agent_response, dict) else False,
            },
        }


validation = ValidationAgent()
