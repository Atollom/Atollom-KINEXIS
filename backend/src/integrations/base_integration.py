"""
Base Integration - Clase base para todas las integraciones
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class BaseIntegration(ABC):
    """Clase base para integraciones externas."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        env = os.getenv("ENVIRONMENT", "sandbox")
        self.is_sandbox = env == "sandbox" or self.config.get("sandbox", True)
        self.name = self.__class__.__name__
        mode = "SANDBOX" if self.is_sandbox else "PRODUCTION"
        logger.info(f"{self.name} initialized (mode={mode})")

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Prueba conexion con la API externa."""

    @abstractmethod
    def _get_sandbox_url(self) -> str:
        """URL base en entorno sandbox/test."""

    @abstractmethod
    def _get_production_url(self) -> str:
        """URL base en entorno produccion."""

    def _get_base_url(self) -> str:
        return self._get_sandbox_url() if self.is_sandbox else self._get_production_url()

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "User-Agent": "KINEXIS/1.0",
        }
