"""Agent #0 — Guardian (main router stub)"""
class GuardianAgent:
    name = "Guardian #0"
    async def execute(self, data):
        return {"success": False, "error": "Guardian routing not implemented", "data": {}}

guardian = GuardianAgent()
