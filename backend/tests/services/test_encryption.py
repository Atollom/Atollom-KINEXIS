"""Tests para EncryptionHelper."""

import pytest
from cryptography.fernet import InvalidToken

from src.utils.encryption import EncryptionHelper


@pytest.fixture
def enc():
    """Fresh EncryptionHelper with generated key each test."""
    key = EncryptionHelper.generate_key()
    return EncryptionHelper(key=key)


# ── Key generation ────────────────────────────────────────────────────────────

def test_generate_key_format():
    key = EncryptionHelper.generate_key()
    assert isinstance(key, str)
    assert len(key) == 44  # Fernet keys are 32 bytes = 44 base64 chars


def test_generate_key_unique():
    assert EncryptionHelper.generate_key() != EncryptionHelper.generate_key()


def test_encryption_helper_no_key_creates_ephemeral(monkeypatch):
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    helper = EncryptionHelper()
    # Should not raise — uses auto-generated ephemeral key
    assert helper is not None


# ── encrypt_dict / decrypt_dict ───────────────────────────────────────────────

def test_encrypt_dict_returns_string(enc):
    result = enc.encrypt_dict({"api_key": "abc123", "secret": "xyz"})
    assert isinstance(result, str)
    assert len(result) > 0


def test_encrypt_dict_is_not_plaintext(enc):
    data = {"api_key": "super_secret"}
    encrypted = enc.encrypt_dict(data)
    assert "super_secret" not in encrypted


def test_roundtrip_dict(enc):
    original = {"api_key": "abc123", "secret": "xyz789", "nested": {"a": 1}}
    encrypted = enc.encrypt_dict(original)
    recovered = enc.decrypt_dict(encrypted)
    assert recovered == original


def test_roundtrip_dict_with_special_chars(enc):
    data = {"rfc": "KAP&Ñ010101AB1", "name": "Héroe S.A. de C.V."}
    assert enc.decrypt_dict(enc.encrypt_dict(data)) == data


def test_roundtrip_dict_empty(enc):
    assert enc.decrypt_dict(enc.encrypt_dict({})) == {}


def test_encrypt_dict_different_ciphertexts(enc):
    """Fernet adds random nonce — same plaintext produces different ciphertext."""
    data = {"key": "value"}
    assert enc.encrypt_dict(data) != enc.encrypt_dict(data)


def test_decrypt_wrong_key_raises(enc):
    encrypted = enc.encrypt_dict({"secret": "value"})
    other_key = EncryptionHelper.generate_key()
    other_enc = EncryptionHelper(key=other_key)
    with pytest.raises(InvalidToken):
        other_enc.decrypt_dict(encrypted)


def test_decrypt_tampered_data_raises(enc):
    encrypted = enc.encrypt_dict({"key": "value"})
    tampered = encrypted[:-4] + "XXXX"
    with pytest.raises(Exception):
        enc.decrypt_dict(tampered)


# ── encrypt_str / decrypt_str ─────────────────────────────────────────────────

def test_roundtrip_str(enc):
    original = "sk_live_supersecretkey_12345"
    assert enc.decrypt_str(enc.encrypt_str(original)) == original


def test_encrypt_str_hides_value(enc):
    value = "mysecretpassword"
    encrypted = enc.encrypt_str(value)
    assert value not in encrypted


# ── Credential payloads (realistic) ──────────────────────────────────────────

def test_ml_credential_roundtrip(enc):
    creds = {
        "access_token": "APP_USR-1234567890-abcdef",
        "refresh_token": "TG-98765432-abcdef",
        "user_id": "123456789",
    }
    assert enc.decrypt_dict(enc.encrypt_dict(creds)) == creds


def test_whatsapp_credential_roundtrip(enc):
    creds = {
        "phone_number_id": "12345678901234",
        "business_account_id": "98765432109876",
        "access_token": "EAAxxxxxxxxxx...",
    }
    assert enc.decrypt_dict(enc.encrypt_dict(creds)) == creds


def test_facturama_credential_roundtrip(enc):
    creds = {"username": "mi_usuario", "password": "mi_password_seguro", "sandbox": True}
    assert enc.decrypt_dict(enc.encrypt_dict(creds)) == creds
