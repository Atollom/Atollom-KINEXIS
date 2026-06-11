"""Sandbox simulators — stubs (full simulators removed, pending rebuild)."""


class _BaseSimulator:
    def __init__(self, name):
        self.name = name

    async def simulate(self, event_type: str, payload: dict) -> dict:
        return {"simulated": False, "error": f"{self.name} simulator not available", "event_type": event_type}

    async def reset(self):
        return {"reset": True, "simulator": self.name}

    async def get_state(self) -> dict:
        return {"simulator": self.name, "state": "stub"}


class MLSimulator(_BaseSimulator):
    def __init__(self):
        super().__init__("mercadolibre")


class AmazonSimulator(_BaseSimulator):
    def __init__(self):
        super().__init__("amazon")


class ShopifySimulator(_BaseSimulator):
    def __init__(self):
        super().__init__("shopify")


class MetaSimulator(_BaseSimulator):
    def __init__(self):
        super().__init__("meta")
