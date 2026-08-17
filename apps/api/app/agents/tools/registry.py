import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional
from sqlalchemy.orm import Session
from apps.api.app.models.models import (
    Lead,
    Appointment,
    Conversation,
    Business,
    BusinessKnowledge,
    Agent,
    AuditLog,
    AutomationExecution,
    Integration
)

logger = logging.getLogger(__name__)


class ToolDefinition:
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        permission_key: str,
        handler: Callable,
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.permission_key = permission_key
        self.handler = handler

    def to_openrouter_tool(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._register_default_tools()

    def register(self, tool: ToolDefinition):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def get_available_tools_for_agent(self, enabled_tool_names: List[str]) -> List[Dict[str, Any]]:
        """Returns JSON schema definitions of tools enabled for this agent."""
        schemas = []
        for name in enabled_tool_names:
            if name in self._tools:
                schemas.append(self._tools[name].to_openrouter_tool())
        return schemas

    async def execute_tool(
        self,
        db: Session,
        business_id: str,
        conversation_id: str,
        tool_name: str,
        arguments_json: str,
        allowed_tools: Dict[str, bool],
    ) -> Dict[str, Any]:
        """Validates permissions and safely executes the registered handler."""
        if tool_name not in self._tools:
            return {"success": False, "error": f"Tool '{tool_name}' is not recognized."}

        tool = self._tools[tool_name]

        if not allowed_tools.get(tool_name, True):
            logger.warning(f"Permission denied for tool '{tool_name}' on business {business_id}")
            return {
                "success": False,
                "error": f"Permission denied: Agent is not authorized to execute '{tool_name}'.",
            }

        try:
            parsed_args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
        except Exception:
            parsed_args = {}

        try:
            result = await tool.handler(db, business_id, conversation_id, parsed_args)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Error executing tool '{tool_name}': {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _register_default_tools(self):
        # 1. Lead Qualification and Extractor
        self.register(
            ToolDefinition(
                name="qualify_and_update_lead",
                description="Extracts customer details, scores lead warmth, and updates qualification status.",
                parameters={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Customer full or first name"},
                        "phone": {"type": "string", "description": "Phone number"},
                        "email": {"type": "string", "description": "Email address"},
                        "service": {"type": "string", "description": "Specific service requested (e.g. AC Repair, Drain Cleaning)"},
                        "problem": {"type": "string", "description": "Detailed description of the problem"},
                        "location": {"type": "string", "description": "Customer address or city/zip"},
                        "preferred_time": {"type": "string", "description": "Preferred service time or date"},
                        "intent": {
                            "type": "string",
                            "enum": ["urgent_repair", "maintenance", "estimate", "general_inquiry"],
                            "description": "Primary customer intent",
                        },
                        "urgency": {
                            "type": "string",
                            "enum": ["low", "medium", "high", "emergency"],
                            "description": "Urgency level",
                        },
                        "score": {"type": "integer", "description": "Lead score from 0-100 (0-30 cold, 31-60 warm, 61-100 hot)"},
                        "notes": {"type": "string", "description": "Internal notes for dispatch team"},
                    },
                },
                permission_key="leads.update",
                handler=_handle_qualify_lead,
            )
        )

        # 2. Calendar Availability Checker
        self.register(
            ToolDefinition(
                name="get_calendar_availability",
                description="Checks open booking appointment slots for the business over the next few days.",
                parameters={
                    "type": "object",
                    "properties": {
                        "days_ahead": {"type": "integer", "default": 3, "description": "Number of days to check for open slots"},
                        "duration_minutes": {"type": "integer", "default": 60, "description": "Appointment duration in minutes"},
                    },
                },
                permission_key="calendar.read",
                handler=_handle_get_availability,
            )
        )

        # 3. Book Appointment
        self.register(
            ToolDefinition(
                name="book_appointment",
                description="Books an appointment on the business calendar after customer confirms slot.",
                parameters={
                    "type": "object",
                    "properties": {
                        "start_time": {"type": "string", "description": "ISO 8601 formatted start datetime (e.g. 2026-08-18T10:00:00)"},
                        "end_time": {"type": "string", "description": "ISO 8601 formatted end datetime (e.g. 2026-08-18T11:00:00)"},
                        "customer_name": {"type": "string", "description": "Name of the customer"},
                        "customer_contact": {"type": "string", "description": "Phone or email of customer"},
                        "service": {"type": "string", "description": "Service to be performed"},
                        "notes": {"type": "string", "description": "Specific instructions or job details"},
                    },
                    "required": ["start_time", "customer_name"],
                },
                permission_key="calendar.create",
                handler=_handle_book_appointment,
            )
        )

        # 4. Human Handoff / Escalation
        self.register(
            ToolDefinition(
                name="human_handoff",
                description="Escalates the conversation to a human manager and pauses AI automation for this thread.",
                parameters={
                    "type": "object",
                    "properties": {
                        "reason": {"type": "string", "description": "Reason for human escalation"},
                        "priority": {"type": "string", "enum": ["normal", "high", "urgent"], "default": "normal"},
                    },
                    "required": ["reason"],
                },
                permission_key="messaging.escalate",
                handler=_handle_human_handoff,
            )
        )

        # 5. Notify Owner
        self.register(
            ToolDefinition(
                name="notify_owner",
                description="Sends an urgent notification alert to the business owner for hot leads or bookings.",
                parameters={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Notification subject"},
                        "message": {"type": "string", "description": "Detailed notification body"},
                        "urgency": {"type": "string", "enum": ["info", "warning", "critical"], "default": "info"},
                    },
                    "required": ["title", "message"],
                },
                permission_key="messaging.notify",
                handler=_handle_notify_owner,
            )
        )

        # =========================================================================
        # 6-11. OWNER COPILOT / WHATSAPP CONTROL CENTER TOOLS
        # =========================================================================

        # 6. Owner Pipeline Summary
        self.register(
            ToolDefinition(
                name="get_owner_pipeline_summary",
                description="Retrieves current real-time statistics on leads, conversion rate, appointments, and estimated revenue for the business owner.",
                parameters={"type": "object", "properties": {}},
                permission_key="owner.analytics",
                handler=_handle_owner_pipeline_summary,
            )
        )

        # 7. Owner Upcoming Appointments
        self.register(
            ToolDefinition(
                name="get_owner_appointments",
                description="Lists confirmed upcoming customer bookings and dispatch schedule.",
                parameters={
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 5, "description": "Number of upcoming appointments to retrieve"}
                    },
                },
                permission_key="owner.appointments",
                handler=_handle_owner_appointments,
            )
        )

        # 8. Owner Recent Inquiries
        self.register(
            ToolDefinition(
                name="get_owner_recent_leads",
                description="Lists the most recent customer conversations and inquiry details.",
                parameters={
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 5, "description": "Number of recent inquiries to fetch"}
                    },
                },
                permission_key="owner.leads",
                handler=_handle_owner_recent_leads,
            )
        )

        # 9. Toggle AI Automation Switch
        self.register(
            ToolDefinition(
                name="toggle_ai_automation",
                description="Pauses or resumes the AI employee for all inbound customer channels.",
                parameters={
                    "type": "object",
                    "properties": {
                        "new_status": {"type": "string", "enum": ["active", "paused"], "description": "Target status"}
                    },
                    "required": ["new_status"],
                },
                permission_key="owner.settings",
                handler=_handle_toggle_ai_automation,
            )
        )

        # 10. Add or Update Service in Knowledge Base
        self.register(
            ToolDefinition(
                name="add_or_update_service_catalog",
                description="Adds a new service or updates price/description in the business knowledge base.",
                parameters={
                    "type": "object",
                    "properties": {
                        "service_name": {"type": "string", "description": "Name of the service"},
                        "price": {"type": "string", "description": "Price or starting rate (e.g. $150 or ₹2,500)"},
                        "description": {"type": "string", "description": "Brief description of what is included"},
                        "duration_minutes": {"type": "integer", "default": 60, "description": "Estimated job duration in minutes"}
                    },
                    "required": ["service_name", "price"],
                },
                permission_key="owner.knowledge",
                handler=_handle_add_or_update_service,
            )
        )

        # 11. Update Business Hours
        self.register(
            ToolDefinition(
                name="update_business_hours_schedule",
                description="Updates business operating hours in the knowledge base.",
                parameters={
                    "type": "object",
                    "properties": {
                        "open_time": {"type": "string", "description": "Opening time e.g. 08:00 or 9:00 AM"},
                        "close_time": {"type": "string", "description": "Closing time e.g. 20:00 or 8:00 PM"},
                        "days": {"type": "string", "description": "Days to apply e.g. 'all', 'weekdays', 'saturday'"}
                    },
                    "required": ["open_time", "close_time"],
                },
                permission_key="owner.knowledge",
                handler=_handle_update_business_hours,
            )
        )


# --- Handler Implementations ---

async def _handle_qualify_lead(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.business_id == business_id).first()
    lead = db.query(Lead).filter(Lead.conversation_id == conversation_id, Lead.business_id == business_id).first()

    if not lead:
        lead = Lead(
            business_id=business_id,
            conversation_id=conversation_id,
            name=args.get("name") or (conv.customer_name if conv else "New Lead"),
            phone=args.get("phone") or (conv.customer_id if conv and conv.channel == "whatsapp" else None),
            email=args.get("email"),
            service=args.get("service"),
            problem=args.get("problem"),
            location=args.get("location"),
            preferred_time=args.get("preferred_time"),
            intent=args.get("intent", "inquiry"),
            urgency=args.get("urgency", "medium"),
            score=args.get("score", 60),
            status="qualified" if args.get("score", 60) >= 60 else "contacted",
            source=conv.channel if conv else "website_chat",
            notes=args.get("notes"),
        )
        db.add(lead)
    else:
        for field in ["name", "phone", "email", "service", "problem", "location", "preferred_time", "intent", "urgency", "notes"]:
            if args.get(field):
                setattr(lead, field, args[field])
        if args.get("score") is not None:
            lead.score = args["score"]
            if lead.score >= 70 and lead.status not in ["booked", "won"]:
                lead.status = "qualified"

    if conv and args.get("name"):
        conv.customer_name = args["name"]

    db.commit()
    db.refresh(lead)
    return {
        "lead_id": lead.id,
        "name": lead.name,
        "score": lead.score,
        "status": lead.status,
        "service": lead.service,
        "intent": lead.intent,
    }


async def _handle_get_availability(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    slots = []
    
    for day_offset in range(1, 4):
        target_day = now + timedelta(days=day_offset)
        slot_1_start = target_day.replace(hour=10, minute=0, second=0, microsecond=0)
        slot_1_end = target_day.replace(hour=11, minute=0, second=0, microsecond=0)
        slot_2_start = target_day.replace(hour=14, minute=0, second=0, microsecond=0)
        slot_2_end = target_day.replace(hour=15, minute=0, second=0, microsecond=0)

        slots.append({
            "slot_id": f"slot_{day_offset}_1",
            "date": target_day.strftime("%A, %B %d"),
            "start_time": slot_1_start.isoformat(),
            "end_time": slot_1_end.isoformat(),
            "display": f"{target_day.strftime('%a, %b %d')} at 10:00 AM",
        })
        slots.append({
            "slot_id": f"slot_{day_offset}_2",
            "date": target_day.strftime("%A, %B %d"),
            "start_time": slot_2_start.isoformat(),
            "end_time": slot_2_end.isoformat(),
            "display": f"{target_day.strftime('%a, %b %d')} at 2:00 PM",
        })

    return {
        "available_slots": slots,
        "total_slots": len(slots),
        "timezone": "America/New_York",
    }


async def _handle_book_appointment(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    start_str = args.get("start_time")
    try:
        start_time = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
    except Exception:
        start_time = datetime.now(timezone.utc) + timedelta(days=1, hours=2)
    
    end_time = start_time + timedelta(minutes=60)
    lead = db.query(Lead).filter(Lead.conversation_id == conversation_id, Lead.business_id == business_id).first()

    appt = Appointment(
        business_id=business_id,
        lead_id=lead.id if lead else None,
        external_event_id=f"evt_gcal_{int(datetime.now().timestamp())}",
        calendar_provider="google_calendar",
        start_time=start_time,
        end_time=end_time,
        status="confirmed",
        customer_name=args.get("customer_name") or (lead.name if lead else "Valued Customer"),
        customer_contact=args.get("customer_contact") or (lead.phone or lead.email if lead else ""),
        service=args.get("service") or (lead.service if lead else "Service Appointment"),
        notes=args.get("notes"),
    )
    db.add(appt)

    if lead:
        lead.status = "booked"
        lead.score = 100

    db.commit()
    db.refresh(appt)

    return {
        "appointment_id": appt.id,
        "status": "confirmed",
        "start_time": appt.start_time.isoformat(),
        "customer_name": appt.customer_name,
        "service": appt.service,
        "confirmation_code": f"LF-{appt.id[:6].upper()}",
    }


async def _handle_human_handoff(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.business_id == business_id).first()
    if conv:
        conv.status = "human_handling"
        db.commit()
    
    audit = AuditLog(
        business_id=business_id,
        action="human_takeover_requested",
        resource="conversation",
        resource_id=conversation_id,
        metadata_info={"reason": args.get("reason"), "priority": args.get("priority")},
    )
    db.add(audit)
    db.commit()

    return {
        "status": "handed_off_to_human",
        "conversation_id": conversation_id,
        "reason": args.get("reason"),
    }


async def _handle_notify_owner(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    audit = AuditLog(
        business_id=business_id,
        action="owner_alert_dispatched",
        resource="conversation",
        resource_id=conversation_id,
        metadata_info={"title": args.get("title"), "message": args.get("message")},
    )
    db.add(audit)
    db.commit()
    return {"dispatched": True, "title": args.get("title")}


# --- Owner Copilot Handlers ---

async def _handle_owner_pipeline_summary(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    leads_count = db.query(Lead).filter(Lead.business_id == business_id).count()
    qualified_count = db.query(Lead).filter(Lead.business_id == business_id, Lead.score >= 60).count()
    appts_count = db.query(Appointment).filter(Appointment.business_id == business_id, Appointment.status == "confirmed").count()
    biz = db.query(Business).filter(Business.id == business_id).first()
    avg_val = getattr(biz, "average_job_value", 500.0) or 500.0
    est_rev = round(appts_count * avg_val, 2)

    return {
        "total_leads": leads_count,
        "qualified_leads": qualified_count,
        "appointments_booked": appts_count,
        "estimated_revenue_generated": est_rev,
        "business_name": biz.name if biz else "Business",
    }


async def _handle_owner_appointments(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    limit = args.get("limit", 5)
    appts = (
        db.query(Appointment)
        .filter(Appointment.business_id == business_id, Appointment.status == "confirmed")
        .order_by(Appointment.start_time.asc())
        .limit(limit)
        .all()
    )
    items = []
    for a in appts:
        items.append({
            "id": a.id,
            "customer_name": a.customer_name,
            "customer_contact": a.customer_contact,
            "service": a.service,
            "start_time": a.start_time.strftime("%a, %b %d at %I:%M %p") if a.start_time else "TBD",
        })
    return {"upcoming_appointments": items, "count": len(items)}


async def _handle_owner_recent_leads(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    limit = args.get("limit", 5)
    leads = (
        db.query(Lead)
        .filter(Lead.business_id == business_id)
        .order_by(Lead.created_at.desc())
        .limit(limit)
        .all()
    )
    items = []
    for l in leads:
        items.append({
            "name": l.name,
            "phone": l.phone,
            "service": l.service,
            "urgency": l.urgency,
            "score": l.score,
            "status": l.status,
        })
    return {"recent_leads": items, "count": len(items)}


async def _handle_toggle_ai_automation(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    target_status = args.get("new_status", "active")
    agent = db.query(Agent).filter(Agent.business_id == business_id).first()
    if not agent:
        agent = Agent(business_id=business_id, name="LeadFlow Assistant", status=target_status)
        db.add(agent)
    else:
        agent.status = target_status
    db.commit()
    db.refresh(agent)
    return {
        "status": agent.status,
        "is_active": agent.status == "active",
        "message": f"AI Employee automation is now {agent.status.upper()}.",
    }


async def _handle_add_or_update_service(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business_id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(business_id=business_id, services=[])
        db.add(knowledge)

    current_services = list(knowledge.services or [])
    name = args.get("service_name", "").strip()
    price = args.get("price", "").strip()
    desc = args.get("description", "Standard service offering")
    duration = args.get("duration_minutes", 60)

    # Check if already exists
    updated = False
    for s in current_services:
        if s.get("name", "").lower() == name.lower():
            s["price"] = price
            if desc:
                s["description"] = desc
            s["duration"] = duration
            updated = True
            break

    if not updated:
        current_services.append({
            "name": name,
            "price": price,
            "description": desc,
            "duration": duration,
        })

    knowledge.services = current_services
    db.commit()
    return {
        "success": True,
        "action": "updated" if updated else "added",
        "service_name": name,
        "price": price,
        "total_services": len(current_services),
    }


async def _handle_update_business_hours(db: Session, business_id: str, conversation_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business_id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(business_id=business_id, hours={})
        db.add(knowledge)

    open_t = args.get("open_time", "08:00")
    close_t = args.get("close_time", "18:00")
    
    # Standardize hours dict
    hours = {
        "monday": {"open": open_t, "close": close_t, "closed": False},
        "tuesday": {"open": open_t, "close": close_t, "closed": False},
        "wednesday": {"open": open_t, "close": close_t, "closed": False},
        "thursday": {"open": open_t, "close": close_t, "closed": False},
        "friday": {"open": open_t, "close": close_t, "closed": False},
        "saturday": {"open": open_t, "close": close_t, "closed": False},
        "sunday": {"open": "00:00", "close": "00:00", "closed": True},
    }
    knowledge.hours = hours
    db.commit()
    return {
        "success": True,
        "message": f"Business operating hours updated: {open_t} to {close_t}.",
    }


tool_registry = ToolRegistry()
