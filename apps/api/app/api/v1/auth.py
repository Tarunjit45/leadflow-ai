from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.security import verify_password, get_password_hash, create_access_token
from apps.api.app.models.models import User, Business, BusinessMember, BusinessKnowledge, Agent, Subscription
from apps.api.app.schemas.schemas import UserCreate, UserLogin, UserOut, Token, UserPasswordUpdate, UserProfileUpdate
from apps.api.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=payload.email,
        name=payload.name or payload.email.split("@")[0].capitalize(),
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.flush()

    # Create default business workspace for this user
    business_name = f"{user.name}'s Service Co"
    business = Business(
        name=business_name,
        industry="Home Services (HVAC/Plumbing/Electrical)",
        timezone="America/New_York",
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
        name="LeadFlow AI Sales Assistant",
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

    token = create_access_token(subject=user.id, business_id=business.id, role="owner")
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user), business_id=business.id)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    member = db.query(BusinessMember).filter(BusinessMember.user_id == user.id).first()
    biz_id = member.business_id if member else None

    token = create_access_token(subject=user.id, business_id=biz_id, role=member.role if member else "owner")
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user), business_id=biz_id)


@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click instant login into populated demo workspace for testing."""
    demo_user = db.query(User).filter(User.email == "demo@leadflow.ai").first()
    if not demo_user:
        # Create demo user & workspace on the fly if not seeded
        demo_user = User(
            email="demo@leadflow.ai",
            name="Demo Operator",
            hashed_password=get_password_hash("demo12345"),
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
        biz = db.query(Business).filter(Business.id == member.business_id).first() if member else None

    biz_id = member.business_id if member else None
    token = create_access_token(subject=demo_user.id, business_id=biz_id, role="owner")
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(demo_user), business_id=biz_id)


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
        current_user.name = payload.name
    if payload.email is not None and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="This email is already in use.")
        current_user.email = payload.email

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

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully."}


@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find businesses where user is owner and delete them
    memberships = db.query(BusinessMember).filter(BusinessMember.user_id == current_user.id).all()
    for m in memberships:
        if m.role == "owner":
            biz = db.query(Business).filter(Business.id == m.business_id).first()
            if biz:
                db.delete(biz)
    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Account and workspace deleted permanently."}
