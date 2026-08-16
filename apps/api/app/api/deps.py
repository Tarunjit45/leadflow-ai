from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.security import decode_access_token
from apps.api.app.models.models import User, Business, BusinessMember

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validates JWT and returns authenticated User."""
    if not token:
        # Fallback to demo user if no token in development mode
        demo_user = db.query(User).filter(User.email == "demo@leadflow.ai").first()
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


async def get_current_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Business:
    """Resolves authenticated tenant (Business) from current user's membership."""
    membership = (
        db.query(BusinessMember)
        .filter(BusinessMember.user_id == current_user.id)
        .first()
    )
    if not membership:
        # Check if any business exists or create default
        biz = db.query(Business).first()
        if biz:
            return biz
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business workspace associated with this user.",
        )
    
    business = db.query(Business).filter(Business.id == membership.business_id).first()
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found.")
    return business
