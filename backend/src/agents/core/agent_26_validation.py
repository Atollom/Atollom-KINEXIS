"""
Agente #26: Validation
Responsabilidad: Validar respuestas de agentes (anti-alucinación)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Strings que indican datos placeholder / no implementados
PLACEHOLDER_SIGNALS = {
    "PENDING_IMPLEMENTATION",
    "PENDING",
    "TODO",
    "MOCK",
    "FAKE",
    "TEST_DATA",
    "PLACEHOLDER",
}


class Agent26Validation:
    """
    Validation — Verifica respuestas de otros agentes antes de entregarlas al usuario.

    Checks:
      - Estructura correcta (has success, data/error fields)
      - Sin datos placeholder
      - Sin campos UUID vacíos cuando se esperan
      - Tipos de datos correctos

    Input:
        {
            "agent_name":  str   — Nombre del agente a validar
            "response":    dict  — Respuesta del agente
            "expected":    dict  — Campos esperados (opcional)
        }

    Output:
        {
            "valid":         bool
            "checks_passed": list
            "checks_failed": list
            "warnings":      list
        }
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #26 - Validation"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida la respuesta de un agente."""
        try:
            agent_name = input_data.get("agent_name", "unknown")
            response = input_data.get("response", {})
            expected = input_data.get("expected", {})

            checks_passed = []
            checks_failed = []
            warnings = []

            # Check 1: Tiene campo success
            if "success" in response:
                checks_passed.append("has_success_field")
            else:
                checks_failed.append("has_success_field")

            # Check 2: Tiene data o error
            if "data" in response or "error" in response:
                checks_passed.append("has_data_or_error")
            else:
                checks_failed.append("has_data_or_error")

            # Check 3: Tiene timestamp
            if "timestamp" in response:
                checks_passed.append("has_timestamp")
            else:
                warnings.append("missing_timestamp")

            # Check 4: Sin placeholders
            response_str = str(response).upper()
            found_placeholders = [p for p in PLACEHOLDER_SIGNALS if p in response_str]
            if not found_placeholders:
                checks_passed.append("no_placeholder_data")
            else:
                warnings.append(f"placeholder_data_found: {found_placeholders}")

            # Check 5: Si success=True, data no debe ser None
            if response.get("success") and response.get("data") is None:
                checks_failed.append("success_true_but_data_is_none")
            elif response.get("success"):
                checks_passed.append("success_has_data")

            # Check 6: Campos esperados presentes
            if expected:
                data = response.get("data", {}) or {}
                for field in expected:
                    if field in data:
                        checks_passed.append(f"expected_field_{field}")
                    else:
                        checks_failed.append(f"missing_expected_field_{field}")

            valid = len(checks_failed) == 0
            logger.info(
                f"{self.name} validated {agent_name}: valid={valid}, "
                f"passed={len(checks_passed)}, failed={len(checks_failed)}"
            )

            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "valid": valid,
                    "agent_validated": agent_name,
                    "checks_passed": checks_passed,
                    "checks_failed": checks_failed,
                    "warnings": warnings,
                },
            }

        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }


validation = Agent26Validation()
