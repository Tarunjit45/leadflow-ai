import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Enum,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from apps.api.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superadmin = Column(Boolean, default=False)
    verification_token = Column(String(128), nullable=True, index=True)
    verification_token_expires_at = Column(DateTime, nullable=True)
    reset_password_token = Column(String(128), nullable=True, index=True)
    reset_password_token_expires_at = Column(DateTime, nullable=True)
    session_version = Column(Integer, default=1)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    memberships = relationship("BusinessMember", back_populates="user", cascade="all, delete-orphan")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="Home Services (HVAC/Plumbing/Electrical)")
    website = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    timezone = Column(String(100), default="America/New_York")
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")  # active, suspended, trial
    average_job_value = Column(Float, default=850.0)  # For estimated revenue recovery calculations
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Multi-tenant relationships
    members = relationship("BusinessMember", back_populates="business", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="business", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="business", cascade="all, delete-orphan")
    knowledge = relationship("BusinessKnowledge", back_populates="business", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="business", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="business", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="business", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="business", cascade="all, delete-orphan")
    automations = relationship("AutomationExecution", back_populates="business", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="business", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="business", cascade="all, delete-orphan")


class BusinessMember(Base):
    __tablename__ = "business_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="owner")  # owner, admin, member
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="memberships")
    business = relationship("Business", back_populates="members")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # whatsapp, google_calendar, google_sheets, stripe, website_chat
    type = Column(String(50), nullable=False)      # messaging, calendar, crm, payments, widget
    access_token_encrypted = Column(Text, nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    scopes = Column(JSON, default=list)
    metadata_info = Column(JSON, default=dict)     # Phone ID, WABA ID, Calendar ID, Sheet ID, etc.
    status = Column(String(50), default="disconnected")  # connected, disconnected, error, pending
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="integrations")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), default="LeadFlow Sales & Booking Agent")
    role = Column(String(255), default="AI Sales & Dispatch Assistant")
    description = Column(Text, default="Handles inbound customer inquiries, qualifies leads, and schedules appointments.")
    system_prompt = Column(Text, nullable=True)
    status = Column(String(50), default="active")  # draft, testing, active, paused
    model = Column(String(100), default="google/gemini-2.0-flash-001")
    temperature = Column(Float, default=0.2)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="agents")
    tools = relationship("AgentTool", back_populates="agent", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="agent")


class AgentTool(Base):
    __tablename__ = "agent_tools"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False)  # send_message, create_lead, update_lead, get_calendar_availability, book_appointment, etc.
    enabled = Column(Boolean, default=True)
    permission_level = Column(String(50), default="read_write")  # read_only, read_write, admin_approval
    configuration = Column(JSON, default=dict)

    agent = relationship("Agent", back_populates="tools")


class BusinessKnowledge(Base):
    __tablename__ = "business_knowledge"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    services = Column(JSON, default=list)        # [{"name": "AC Repair", "description": "Diagnostic and repair", "price": "$120+", "duration": 60}]
    pricing_info = Column(Text, nullable=True)
    hours = Column(JSON, default=dict)           # {"monday": {"open": "08:00", "close": "18:00", "closed": False}, ...}
    service_areas = Column(JSON, default=list)   # ["Austin, TX", "Round Rock, TX", "78701", "78702"]
    faqs = Column(JSON, default=list)            # [{"question": "Do you offer warranties?", "answer": "Yes, 1-year parts and labor."}]
    policies = Column(Text, nullable=True)       # Cancellation policies, deposit requirements
    booking_rules = Column(JSON, default=dict)   # {"min_notice_hours": 2, "max_advance_days": 30, "slot_duration_mins": 60, "buffer_mins": 15}
    custom_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="knowledge")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(String(255), nullable=False, index=True)  # Phone number, session token, or email
    customer_name = Column(String(255), nullable=True)
    channel = Column(String(50), default="website_chat")  # whatsapp, website_chat, sms
    status = Column(String(50), default="ai_handling")    # ai_handling, human_handling, resolved, closed
    assigned_to = Column(String(255), nullable=True)
    last_message_preview = Column(Text, nullable=True)
    last_message_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="conversations")
    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    lead = relationship("Lead", back_populates="conversation", uselist=False)
    follow_ups = relationship("FollowUp", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(50), nullable=False)  # customer, ai, human, system
    sender_id = Column(String(255), nullable=True)
    channel_message_id = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    metadata_info = Column(JSON, default=dict)        # tool calls, token stats, status receipts
    created_at = Column(DateTime, default=get_utc_now)

    conversation = relationship("Conversation", back_populates="messages")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, unique=True, index=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    service = Column(String(255), nullable=True)
    problem = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    preferred_time = Column(String(255), nullable=True)
    intent = Column(String(100), default="inquiry")  # urgent_repair, maintenance, estimate, general_inquiry
    urgency = Column(String(50), default="medium")   # low, medium, high, emergency
    score = Column(Integer, default=50)              # 0-100: 0-30 Cold, 31-60 Warm, 61-100 Hot
    status = Column(String(50), default="new")       # new, contacted, qualified, booked, won, lost, nurturing, human_review
    source = Column(String(50), default="website_chat")  # whatsapp, website_chat, google, manual
    estimated_value = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    metadata_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="leads")
    conversation = relationship("Conversation", back_populates="lead")
    appointments = relationship("Appointment", back_populates="lead", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="lead", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    external_event_id = Column(String(255), nullable=True)  # Google Calendar Event ID
    calendar_provider = Column(String(50), default="google_calendar")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="confirmed")  # confirmed, rescheduled, cancelled, completed, no_show
    customer_name = Column(String(255), nullable=True)
    customer_contact = Column(String(255), nullable=True)
    service = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="appointments")
    lead = relationship("Lead", back_populates="appointments")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_for = Column(DateTime, nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    status = Column(String(50), default="scheduled")  # scheduled, sent, cancelled, skipped
    message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="follow_ups")
    lead = relationship("Lead", back_populates="follow_ups")
    conversation = relationship("Conversation", back_populates="follow_ups")


class AutomationExecution(Base):
    __tablename__ = "automation_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), nullable=True)
    trigger = Column(String(100), nullable=False)     # inbound_message, follow_up_trigger, calendar_sync, qualification
    state = Column(String(50), default="success")     # success, failed, running
    tool_calls = Column(JSON, default=list)
    result = Column(JSON, default=dict)
    error = Column(Text, nullable=True)
    latency_ms = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    business = relationship("Business", back_populates="automations")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    provider = Column(String(50), default="dodo")  # dodo or stripe
    
    # Generic provider IDs
    provider_customer_id = Column(String(255), nullable=True)
    provider_subscription_id = Column(String(255), nullable=True)
    provider_product_id = Column(String(255), nullable=True)
    provider_price_id = Column(String(255), nullable=True)
    
    # Backwards compatibility legacy aliases
    customer_id = Column(String(255), nullable=True)
    subscription_id = Column(String(255), nullable=True)
    price_id = Column(String(255), nullable=True)

    # Multi-currency & pricing
    currency = Column(String(10), default="USD")
    amount = Column(Float, default=99.0)
    billing_interval = Column(String(20), default="month")  # month, year

    plan_tier = Column(String(50), default="trial")   # trial, starter, growth, enterprise
    status = Column(String(50), default="trialing")   # normalized: trialing, active, past_due, cancelled, expired, paused
    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    
    # Usage counters for the period
    messages_count = Column(Integer, default=0)
    leads_count = Column(Integer, default=0)
    appointments_count = Column(Integer, default=0)
    
    # Plan Limits
    messages_limit = Column(Integer, default=500)
    appointments_limit = Column(Integer, default=50)

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    business = relationship("Business", back_populates="subscription")


class PaymentProviderEvent(Base):
    __tablename__ = "payment_provider_events"
    __table_args__ = (
        UniqueConstraint("provider", "provider_event_id", name="uq_payment_provider_event"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(50), nullable=False, index=True)
    provider_event_id = Column(String(255), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload_hash = Column(String(64), nullable=True)
    status = Column(String(50), default="processed")  # processed, failed, ignored
    processed_at = Column(DateTime, default=get_utc_now)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    business = relationship("Business", back_populates="audit_logs")
