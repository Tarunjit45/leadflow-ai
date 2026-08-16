import bcrypt
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import JWTError, jwt
from apps.api.app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored bcrypt hash."""
    try:
        # Truncate to 72 bytes if needed per bcrypt specification
        pwd_bytes = plain_password[:72].encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback if plain sha256
        sha = hashlib.sha256(plain_password.encode()).hexdigest()
        return sha == hashed_password


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for a password."""
    pwd_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    business_id: Optional[str] = None,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generates a signed JWT access token containing subject, tenant (business_id), and role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "business_id": business_id,
        "role": role or "owner"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
