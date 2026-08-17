import re
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import EmailStr

from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.core.security import verify_password, get_password_hash, create_access_token
from apps.api.app.core.email import EmailService
from apps.api.app.core.rate_limiter import rate_limit_by_ip
from apps.api.app.models.models import User, Business, BusinessMember, BusinessKnowledge, Agent, Subscription
from apps.api.app.schemas.schemas import (
    UserCreate,
    UserLogin,
    UserOut,
    Token,
    UserPasswordUpdate,
    UserProfileUpdate,
    VerifyEmailPayload,
    ResendVerificationPayload,
    ForgotPasswordPayload,
    ResetPasswordPayload,
)
from apps.api.app.api.deps import get_current_user

logger = logging.getLogger("leadflow_auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def normalize_email(email: str) -> str:
    """Trim whitespace and convert to lowercase for consistent storage."""
    return email.strip().lower()


def validate_email_syntax(email: str) -> str:
    normalized = normalize_email(email)
    if not normalized or len(normalized) > 254 or not EMAIL_REGEX.match(normalized):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address.",
        )
    return normalized


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number.",
        )


def mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return email
    user, domain = parts
    masked_user = f"{user[0]}***" if len(user) > 0 else "***"
    return f"{masked_user}@{domain}"


@router.post("/register")
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Registers a new user and sends an email verification link."""
    rate_limit_by_ip(request, action="register", max_requests=8, window_seconds=60)
    
    email = validate_email_syntax(payload.email)
    validate_password_policy(payload.password)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # Safe response to prevent account enumeration while remaining helpful
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email may already be registered. Try signing in or reset your password.",
        )

    verification_token = secrets.token_urlsafe(32)
    token_expiry = datetime.now(timezone.utc) + timedelta(hours=24)

    # In local demo mode, auto-verify for instant developer onboarding testing
    is_verified = bool(settings.ENABLE_DEMO_MODE)

    user = User(
        email=email,
        name=(payload.name or email.split("@")[0]).strip().title(),
        hashed_password=get_password_hash(payload.password),
        is_verified=is_verified,
        verification_token=None if is_verified else verification_token,
        verification_token_expires_at=None if is_verified else token_expiry,
        session_version=1,
    )
    db.add(user)
    db.flush()

    # Create real business workspace for this user
    real_biz_name = (payload.business_name or "").strip() or f"{user.name}'s Company"
    real_phone = (payload.phone or "").strip()
    real_city = (payload.city or "").strip()

    business = Business(
        name=real_biz_name,
        phone=real_phone,
        address=real_city,
        industry="Home Services & Contractors",
        timezone="Asia/Kolkata" if "+91" in real_phone else "America/New_York",
        onboarding_completed=False,
    )
    db.add(business)
    db.flush()

    member = BusinessMember(business_id=business.id, user_id=user.id, role="owner")
    db.add(member)

    # Initialize business knowledge
    knowledge = BusinessKnowledge(
        business_id=business.id,
        services=[
            {"name": "AC Diagnostic & Repair", "description": "Full system inspection and repair", "price": "$120+", "duration": 60},
            {"name": "HVAC System Maintenance", "description": "Comprehensive tune-up and filter change", "price": "$180", "duration": 60},
            {"name": "Emergency Pipe Leak Repair", "description": "Immediate leak stoppage and repair", "price": "$250+", "duration": 90},
        ],
        hours={
            "monday": {"open": "08:00", "close": "18:00", "closed": False},
            "tuesday": {"open": "08:00", "close": "18:00", "closed": False},
            "wednesday": {"open": "08:00", "close": "18:00", "closed": False},
            "thursday": {"open": "08:00", "close": "18:00", "closed": False},
            "friday": {"open": "08:00", "close": "18:00", "closed": False},
            "saturday": {"open": "09:00", "close": "16:00", "closed": False},
            "sunday": {"open": "00:00", "close": "00:00", "closed": True},
        },
        service_areas=["Austin, TX", "Round Rock, TX", "Cedar Park, TX"],
        faqs=[
            {"question": "Do you provide emergency service?", "answer": "Yes, we have 24/7 on-call dispatch available."},
            {"question": "Are you licensed and insured?", "answer": "Yes, we are fully licensed, bonded, and insured."},
        ],
    )
    db.add(knowledge)

    # Initialize default agent
    agent = Agent(
        business_id=business.id,
        name="LeadFlow AI Assistant",
        role="AI Sales & Dispatch Specialist",
        status="active",
    )
    db.add(agent)

    # Initialize trial subscription
    sub = Subscription(
        business_id=business.id,
        plan_tier="trial",
        status="trialing",
        messages_limit=500,
        appointments_limit=50,
    )
    db.add(sub)

    db.commit()
    db.refresh(user)

    if not is_verified:
        # Dispatch verification email
        EmailService.send_verification_email(
            to_email=user.email,
            name=user.name or "",
            token=verification_token,
            app_url=settings.APP_URL,
        )
        return {
            "status": "success",
            "message": "Account created. Please check your email to verify your workspace.",
            "requires_verification": True,
            "masked_email": mask_email(user.email),
            "email": user.email,
            "dev_verification_token": verification_token if settings.ENVIRONMENT == "development" else None,
        }

    # Auto-verified flow (Demo / Instant mode)
    token = create_access_token(
        subject=user.id,
        business_id=business.id,
        role="owner",
        session_version=user.session_version,
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        business_id=business.id,
        requires_verification=False,
    )


@router.post("/verify-email", response_model=Token)
def verify_email(payload: VerifyEmailPayload, db: Session = Depends(get_db)):
    """Validates single-use cryptographically secure email verification token."""
    user = (
        db.query(User)
        .filter(User.verification_token == payload.token)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link is invalid or has already been used.",
        )

    now = datetime.now(timezone.utc)
    if user.verification_token_expires_at:
        expiry = user.verification_token_expires_at.replace(tzinfo=timezone.utc) if user.verification_token_expires_at.tzinfo is None else user.verification_token_expires_at
        if now > expiry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link has expired. Please request a new verification email.",
            )

    # Invalidate token and mark verified
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    user.session_version = (user.session_version or 1) + 1
    user.last_login_at = now
    db.commit()
    db.refresh(user)

    member = db.query(BusinessMember).filter(BusinessMember.user_id == user.id).first()
    biz_id = member.business_id if member else None
    biz = db.query(Business).filter(Business.id == biz_id).first() if biz_id else None

    # Send welcome email
    EmailService.send_welcome_email(
        to_email=user.email,
        name=user.name or "",
        business_name=biz.name if biz else "LeadFlow AI",
        app_url=settings.APP_URL,
    )

    token = create_access_token(
        subject=user.id,
        business_id=biz_id,
        role=member.role if member else "owner",
        session_version=user.session_version,
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        business_id=biz_id,
        requires_verification=False,
    )


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationPayload, request: Request, db: Session = Depends(get_db)):
    """Resends a verification email with a fresh single-use token."""
    rate_limit_by_ip(request, action="resend_verification", max_requests=4, window_seconds=60)
    email = normalize_email(payload.email)

    user = db.query(User).filter(User.email == email).first()
    if user and not user.is_verified:
        new_token = secrets.token_urlsafe(32)
        user.verification_token = new_token
        user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()

        EmailService.send_verification_email(
            to_email=user.email,
            name=user.name or "",
            token=new_token,
            app_url=settings.APP_URL,
        )

    # Always return success to prevent account enumeration
    return {
        "status": "success",
        "message": "If an unverified account exists for this email, a new verification link has been sent.",
    }


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticates user with rate-limiting and verification verification."""
    rate_limit_by_ip(request, action="login", max_requests=8, window_seconds=60)
    email = normalize_email(payload.email)

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    if not user.is_verified and not getattr(user, "is_superadmin", False) and not settings.ENABLE_DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before continuing. Check your inbox for the verification link.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    member = db.query(BusinessMember).filter(BusinessMember.user_id == user.id).first()
    biz_id = member.business_id if member else None

    token = create_access_token(
        subject=user.id,
        business_id=biz_id,
        role=member.role if member else "owner",
        session_version=user.session_version or 1,
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        business_id=biz_id,
        requires_verification=False,
    )


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload, request: Request, db: Session = Depends(get_db)):
    """Initiates password reset with account-enumeration-safe response."""
    rate_limit_by_ip(request, action="forgot_password", max_requests=5, window_seconds=60)
    email = normalize_email(payload.email)

    user = db.query(User).filter(User.email == email).first()
    if user and user.is_active:
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

        EmailService.send_password_reset_email(
            to_email=user.email,
            name=user.name or "",
            token=reset_token,
            app_url=settings.APP_URL,
        )

    # Safe generic message regardless of email existence
    return {
        "status": "success",
        "message": "If an account exists for that email, we've sent a password reset link.",
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload, request: Request, db: Session = Depends(get_db)):
    """Updates password and revokes all previous active sessions."""
    rate_limit_by_ip(request, action="reset_password", max_requests=5, window_seconds=60)
    validate_password_policy(payload.new_password)

    user = (
        db.query(User)
        .filter(User.reset_password_token == payload.token)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link is invalid or has already been used.",
        )

    now = datetime.now(timezone.utc)
    if user.reset_password_token_expires_at:
        expiry = user.reset_password_token_expires_at.replace(tzinfo=timezone.utc) if user.reset_password_token_expires_at.tzinfo is None else user.reset_password_token_expires_at
        if now > expiry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset link has expired. Please request a new password reset.",
            )

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    # Invalidate all existing sessions
    user.session_version = (user.session_version or 1) + 1
    db.commit()

    return {
        "status": "success",
        "message": "Your password has been updated. You can now sign in with your new password.",
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revokes current and all active JWT sessions for this user."""
    current_user.session_version = (current_user.session_version or 1) + 1
    db.commit()
    return {"status": "success", "message": "Successfully signed out."}


@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """Instant 1-click sandbox login for testing."""
    demo_user = db.query(User).filter(User.email == "demo@leadflow.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@leadflow.ai",
            name="Demo Operator",
            hashed_password=get_password_hash("demo12345"),
            is_verified=True,
            session_version=1,
        )
        db.add(demo_user)
        db.flush()

        biz = Business(
            name="Apex Comfort HVAC & Plumbing",
            industry="HVAC & Plumbing Services",
            timezone="America/New_York",
            onboarding_completed=True,
            average_job_value=850.0,
            phone="+1 (512) 555-0199",
            email="contact@apexcomfort.com",
            address="1200 Industrial Parkway, Austin, TX 78701",
        )
        db.add(biz)
        db.flush()

        member = BusinessMember(business_id=biz.id, user_id=demo_user.id, role="owner")
        db.add(member)
        db.commit()
        db.refresh(demo_user)
    else:
        member = db.query(BusinessMember).filter(BusinessMember.user_id == demo_user.id).first()

    biz_id = member.business_id if member else None
    token = create_access_token(
        subject=demo_user.id,
        business_id=biz_id,
        role="owner",
        session_version=demo_user.session_version or 1,
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(demo_user),
        business_id=biz_id,
        requires_verification=False,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.email is not None and payload.email != current_user.email:
        new_email = validate_email_syntax(payload.email)
        existing = db.query(User).filter(User.email == new_email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="This email is already in use.")
        current_user.email = new_email

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.patch("/password")
def update_password(
    payload: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.hashed_password and not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    validate_password_policy(payload.new_password)
    current_user.hashed_password = get_password_hash(payload.new_password)
    # Invalidate other active sessions
    current_user.session_version = (current_user.session_version or 1) + 1
    db.commit()
    return {"status": "success", "message": "Password updated successfully."}


@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently deletes user account, business workspace, and all data."""
    memberships = db.query(BusinessMember).filter(BusinessMember.user_id == current_user.id).all()
    for m in memberships:
        if m.role == "owner":
            biz = db.query(Business).filter(Business.id == m.business_id).first()
            if biz:
                db.delete(biz)
    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Account and workspace permanently deleted."}
