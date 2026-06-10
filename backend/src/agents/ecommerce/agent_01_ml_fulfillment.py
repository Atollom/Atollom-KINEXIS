"""Agent #1 — MercadoLibre Fulfillment (stub)"""
class MLFulfillmentAgent:
    name = "ML Fulfillment #1"
    async def execute(self, data):
        return {"success": False, "error": "MercadoLibre certification pending", "data": {}}

ml_fulfillment = MLFulfillmentAgent()
