import base64
import hashlib
from cryptography.fernet import Fernet
from apps.api.app.core.config import settings


def _get_fernet_key() -> bytes:
    # Ensure 32-byte urlsafe base64-encoded key
    raw_key = settings.ENCRYPTION_KEY or settings.SECRET_KEY
    key_hash = hashlib.sha256(raw_key.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)


def encrypt_token(plain_token: str) -> str:
    """Encrypts a sensitive credential or OAuth token."""
    if not plain_token:
        return ""
    f = Fernet(_get_fernet_key())
    encrypted = f.encrypt(plain_token.encode())
    return encrypted.decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypts an encrypted token."""
    if not encrypted_token:
        return ""
    try:
        f = Fernet(_get_fernet_key())
        decrypted = f.decrypt(encrypted_token.encode())
        return decrypted.decode()
    except Exception:
        # Return masked fallback if decryption fails
        return ""
