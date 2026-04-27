"""
Encryption utilities for sensitive API credentials.
Fernet = AES-128-CBC + HMAC-SHA256, base64-encoded output.
"""

import json
import logging
import os
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)


class EncryptionHelper:
    """Symmetric encryption for tenant API credentials stored in BD."""

    def __init__(self, key: str | None = None):
        raw_key = key or os.getenv("ENCRYPTION_KEY")
        if not raw_key:
            logger.warning(
                "ENCRYPTION_KEY not set — generating ephemeral key. "
                "Set ENCRYPTION_KEY in .env for production."
            )
            raw_key = Fernet.generate_key().decode()
        self._fernet = Fernet(
            raw_key.encode() if isinstance(raw_key, str) else raw_key
        )

    # ── Public API ────────────────────────────────────────────────────────────

    def encrypt_dict(self, data: Dict[str, Any]) -> str:
        """
        Serializes dict → JSON → encrypts → returns base64 string.

        Args:
            data: Credential dict, e.g. {"api_key": "...", "secret": "..."}

        Returns:
            Encrypted base64 string safe to store in TEXT column.
        """
        try:
            payload = json.dumps(data, ensure_ascii=False)
            return self._fernet.encrypt(payload.encode()).decode()
        except Exception as exc:
            logger.error(f"encrypt_dict failed: {exc}")
            raise

    def decrypt_dict(self, encrypted: str) -> Dict[str, Any]:
        """
        Decrypts base64 string → JSON → dict.

        Raises:
            cryptography.fernet.InvalidToken if the data is tampered or
            encrypted with a different key.
        """
        try:
            decrypted = self._fernet.decrypt(encrypted.encode())
            return json.loads(decrypted.decode())
        except InvalidToken:
            logger.error("decrypt_dict: invalid token — wrong key or tampered data")
            raise
        except Exception as exc:
            logger.error(f"decrypt_dict failed: {exc}")
            raise

    def encrypt_str(self, value: str) -> str:
        """Encrypts a plain string (for passwords, tokens)."""
        return self._fernet.encrypt(value.encode()).decode()

    def decrypt_str(self, encrypted: str) -> str:
        """Decrypts an encrypted string."""
        return self._fernet.decrypt(encrypted.encode()).decode()

    # ── Key management ────────────────────────────────────────────────────────

    @staticmethod
    def generate_key() -> str:
        """
        Generates a new Fernet key.

        Run once and add to .env:
            ENCRYPTION_KEY=<output>
        """
        return Fernet.generate_key().decode()


# Singleton — shared across the app
encryption = EncryptionHelper()
