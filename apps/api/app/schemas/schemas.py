from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_superadmin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    business_id: Optional[str] = None


# --- Business & Onboarding Schemas ---
class BusinessCreate(BaseModel):
    name: str
    industry: Optional[str] = "Home Services (HVAC/Plumbing/Electrical)"
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = "America/New_York"
    description: Optional[str] = None
    average_job_value: Optional[float] = 850.0


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    average_job_value: Optional[float] = None
    onboarding_completed: Optional[bool] = None


class BusinessOut(BaseModel):
    id: str
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    timezone: str
    description: Optional[str] = None
    status: str
    average_job_value: float
    onboarding_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OnboardingPayload(BaseModel):
    business_name: str
    industry: str
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    timezone: str = "America/New_York"
    description: Optional[str] = None
    services: List[Dict[str, Any]] = []
    hours: Dict[str, Any] = {}
    service_areas: List[str] = []
    agent_name: str = "LeadFlow AI Sales Assistant"
    agent_role: str = "AI Sales & Appointment Booker"


# --- Knowledge Schemas ---
class BusinessKnowledgeUpdate(BaseModel):
    services: Optional[List[Dict[str, Any]]] = None
    pricing_info: Optional[str] = None
    hours: Optional[Dict[str, Any]] = None
    service_areas: Optional[List[str]] = None
    faqs: Optional[List[Dict[str, str]]] = None
    policies: Optional[str] = None
    booking_rules: Optional[Dict[str, Any]] = None
    custom_instructions: Optional[str] = None


class BusinessKnowledgeOut(BaseModel):
    id: str
    business_id: str
    services: List[Dict[str, Any]] = []
    pricing_info: Optional[str] = None
    hours: Dict[str, Any] = {}
    service_areas: List[str] = []
    faqs: List[Dict[str, str]] = []
    policies: Optional[str] = None
    booking_rules: Dict[str, Any] = {}
    custom_instructions: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Agent & Tool Schemas ---
class AgentToolUpdate(BaseModel):
    tool_name: str
    enabled: bool
    permission_level: Optional[str] = "read_write"
    configuration: Optional[Dict[str, Any]] = None


class AgentToolOut(BaseModel):
    id: str
    tool_name: str
    enabled: bool
    permission_level: str
    configuration: Dict[str, Any] = {}

    model_config = {"from_attributes": True}


class AgentCreate(BaseModel):
    name: str = "LeadFlow Sales & Booking Agent"
    role: str = "AI Sales & Dispatch Assistant"
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: str = "google/gemini-2.0-flash-001"
    temperature: float = 0.2
    status: str = "active"


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    status: Optional[str] = None


class AgentOut(BaseModel):
    id: str
    business_id: str
    name: str
    role: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    status: str
    model: str
    temperature: float
    tools: List[AgentToolOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Message & Conversation Schemas ---
class MessageCreate(BaseModel):
    content: str
    sender_type: str = "customer"  # customer, human, ai
    sender_id: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_type: str
    sender_id: Optional[str] = None
    content: str
    metadata_info: Dict[str, Any] = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    business_id: str
    agent_id: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    channel: str
    status: str
    assigned_to: Optional[str] = None
    last_message_preview: Optional[str] = None
    last_message_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class TakeoverPayload(BaseModel):
    status: str = "human_handling"  # ai_handling, human_handling, resolved


# --- Lead Schemas ---
class LeadCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    problem: Optional[str] = None
    location: Optional[str] = None
    preferred_time: Optional[str] = None
    intent: Optional[str] = "inquiry"
    urgency: Optional[str] = "medium"
    score: Optional[int] = 50
    status: Optional[str] = "new"
    source: Optional[str] = "website_chat"
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    problem: Optional[str] = None
    location: Optional[str] = None
    preferred_time: Optional[str] = None
    intent: Optional[str] = None
    urgency: Optional[str] = None
    score: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LeadOut(BaseModel):
    id: str
    business_id: str
    conversation_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    problem: Optional[str] = None
    location: Optional[str] = None
    preferred_time: Optional[str] = None
    intent: str
    urgency: str
    score: int
    status: str
    source: str
    estimated_value: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    lead_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    service: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: str
    business_id: str
    lead_id: Optional[str] = None
    external_event_id: Optional[str] = None
    calendar_provider: str
    start_time: datetime
    end_time: datetime
    status: str
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    service: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Follow-Up Schemas ---
class FollowUpOut(BaseModel):
    id: str
    business_id: str
    lead_id: str
    conversation_id: str
    scheduled_for: datetime
    attempt_number: int
    status: str
    message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Integration Schemas ---
class IntegrationOut(BaseModel):
    id: str
    business_id: str
    provider: str
    type: str
    status: str
    scopes: List[str] = []
    metadata_info: Dict[str, Any] = {}
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Analytics Schemas ---
class AnalyticsSummaryOut(BaseModel):
    total_leads: int
    leads_contacted: int
    qualified_leads: int
    hot_leads: int
    appointments_booked: int
    follow_ups_sent: int
    recovered_leads: int
    conversion_rate_pct: float
    avg_response_time_seconds: float
    estimated_revenue_recovered: float
    average_job_value: float
    leads_by_source: Dict[str, int]
    leads_by_intent: Dict[str, int]
    weekly_trend: List[Dict[str, Any]]


# --- Billing & Subscription Schemas ---
class SubscriptionOut(BaseModel):
    plan_tier: str
    status: str
    messages_count: int
    messages_limit: int
    leads_count: int
    appointments_count: int
    appointments_limit: int
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


# --- Agent Test Console Schemas ---
class AgentTestRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    mock_history: Optional[List[Dict[str, str]]] = None


class AgentTestResponse(BaseModel):
    reply: str
    conversation_id: str
    tool_calls: List[Dict[str, Any]] = []
    lead_extraction: Optional[Dict[str, Any]] = None
    confidence_score: float = 0.95
    latency_ms: int = 0
    model: str


# --- System Status Schemas ---
class ServiceHealth(BaseModel):
    name: str
    configured: bool
    status: str  # healthy, not_configured, degraded, error
    details: Optional[str] = None
    required_variables: List[str] = []
    setup_url: Optional[str] = None


class SystemStatusOut(BaseModel):
    status: str
    environment: str
    version: str
    services: List[ServiceHealth]
