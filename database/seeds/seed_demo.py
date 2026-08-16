import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from apps.api.app.core.database import SessionLocal, Base, engine
from apps.api.app.core.security import get_password_hash
from apps.api.app.models.models import (
    User,
    Business,
    BusinessMember,
    BusinessKnowledge,
    Agent,
    AgentTool,
    Conversation,
    Message,
    Lead,
    Appointment,
    FollowUp,
    Subscription,
    Integration,
)


def seed_database():
    print("Initializing schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@leadflow.ai").first()
        if existing_user:
            print("Database already seeded with demo data.")
            return

        print("Seeding demo business and HVAC operations...")
        user = User(
            id="usr_demo_001",
            email="demo@leadflow.ai",
            name="Alex Morgan",
            hashed_password=get_password_hash("demo12345"),
            is_superadmin=True,
        )
        db.add(user)
        db.flush()

        business = Business(
            id="biz_demo_hvac_001",
            name="Apex Air & Plumbing Specialists",
            industry="HVAC & Plumbing Services",
            website="https://apexairandplumbing.com",
            phone="+1 (512) 555-0149",
            email="dispatch@apexairandplumbing.com",
            address="4200 North Lamar Blvd, Suite 210, Austin, TX 78756",
            timezone="America/Chicago",
            description="Austin's premier residential and commercial heating, cooling, and plumbing contractors. Available 24/7 for emergency repairs and precision tune-ups.",
            average_job_value=850.0,
            onboarding_completed=True,
        )
        db.add(business)
        db.flush()

        member = BusinessMember(
            business_id=business.id,
            user_id=user.id,
            role="owner",
        )
        db.add(member)

        # Knowledge base
        knowledge = BusinessKnowledge(
            business_id=business.id,
            services=[
                {"name": "AC Emergency Repair & Diagnostics", "description": "Rapid refrigerant leak detection, capacitor replacement, and system triage.", "price": "$129 Diagnostic Fee", "duration": 60},
                {"name": "Complete HVAC Seasonal Tune-up", "description": "24-point electrical, coil cleaning, airflow balance, and filter refresh.", "price": "$189 Flat Rate", "duration": 75},
                {"name": "Tankless Water Heater Installation", "description": "High-efficiency Navien and Rinnai installation with 10-year warranty.", "price": "$2,400 - $3,800", "duration": 240},
                {"name": "Main Drain Hydro-Jetting", "description": "High-pressure cleanout for tree roots and stubborn main line clogs.", "price": "$350 - $550", "duration": 90},
                {"name": "Heat Pump Replacement & Rebates", "description": "SEER2 high-efficiency heat pump systems with instant local utility rebates.", "price": "$6,500+", "duration": 360},
            ],
            pricing_info="Diagnostic fee is waived if repair work is approved. Upfront pricing before any wrench turns.",
            hours={
                "monday": {"open": "07:30", "close": "19:00", "closed": False},
                "tuesday": {"open": "07:30", "close": "19:00", "closed": False},
                "wednesday": {"open": "07:30", "close": "19:00", "closed": False},
                "thursday": {"open": "07:30", "close": "19:00", "closed": False},
                "friday": {"open": "07:30", "close": "19:00", "closed": False},
                "saturday": {"open": "08:00", "close": "17:00", "closed": False},
                "sunday": {"open": "09:00", "close": "14:00", "closed": False},
            },
            service_areas=["Austin (All Neighborhoods)", "Round Rock", "Cedar Park", "Pflugerville", "Westlake Hills", "Lakeway", "Georgetown"],
            faqs=[
                {"question": "Do you offer emergency after-hours dispatch?", "answer": "Yes, our certified technicians are on stand-by 24/7 for severe water leaks and loss of AC during peak heat."},
                {"question": "Are your technicians licensed and background checked?", "answer": "Every technician is TDLR licensed, EPA-608 universal certified, drug-tested, and background checked."},
                {"question": "Do you offer financing?", "answer": "Yes, we offer 0% APR financing for 12 to 36 months through Synchrony and GreenSky."},
            ],
            policies="100% Satisfaction Guarantee. 1-year warranty on all replacement parts and labor. Free second opinions on system replacements.",
            booking_rules={"min_notice_hours": 2, "max_advance_days": 30, "slot_duration_mins": 60, "buffer_mins": 15},
            custom_instructions="Always be empathetic when customer homes are uncomfortably hot or flooded. Prioritize booking an inspection slot promptly.",
        )
        db.add(knowledge)

        # Agent
        agent = Agent(
            business_id=business.id,
            name="Apex Dispatch AI",
            role="Lead Qualifier & Service Scheduler",
            status="active",
            model="google/gemini-2.0-flash-001",
            temperature=0.2,
        )
        db.add(agent)
        db.flush()

        # Tools
        default_tools = [
            ("qualify_and_update_lead", True, "read_write"),
            ("get_calendar_availability", True, "read_only"),
            ("book_appointment", True, "read_write"),
            ("human_handoff", True, "read_write"),
            ("notify_owner", True, "read_write"),
        ]
        for t_name, enabled, perm in default_tools:
            db.add(AgentTool(agent_id=agent.id, tool_name=t_name, enabled=enabled, permission_level=perm))

        # Integrations
        db.add(Integration(business_id=business.id, provider="website_chat", type="widget", status="connected"))
        db.add(Integration(business_id=business.id, provider="google_calendar", type="calendar", status="connected", metadata_info={"calendar_name": "Apex Service Dispatch"}))
        db.add(Integration(business_id=business.id, provider="whatsapp", type="messaging", status="connected", metadata_info={"phone_number": "+1 (512) 555-0149"}))
        db.add(Integration(business_id=business.id, provider="stripe", type="payments", status="connected"))

        # Subscription
        db.add(Subscription(
            business_id=business.id,
            plan_tier="growth",
            status="active",
            messages_count=342,
            messages_limit=2500,
            leads_count=48,
            appointments_count=19,
            appointments_limit=250,
        ))

        # Sample Conversations & Leads
        now = datetime.now(timezone.utc)
        
        # Lead 1: Hot / Booked
        conv1 = Conversation(
            business_id=business.id,
            agent_id=agent.id,
            customer_id="+15125559821",
            customer_name="Sarah Jenkins",
            channel="whatsapp",
            status="ai_handling",
            last_message_preview="Appointment confirmed for tomorrow at 10:00 AM! Tech David is assigned.",
            last_message_at=now - timedelta(minutes=45),
        )
        db.add(conv1)
        db.flush()

        lead1 = Lead(
            business_id=business.id,
            conversation_id=conv1.id,
            name="Sarah Jenkins",
            phone="+1 (512) 555-9821",
            email="sarah.jenkins@gmail.com",
            service="AC Emergency Repair",
            problem="AC blowing warm air, outdoor condenser making loud grinding noise in 98° weather.",
            location="Westlake Hills, TX 78746",
            preferred_time="Tomorrow morning 10 AM",
            intent="urgent_repair",
            urgency="emergency",
            score=95,
            status="booked",
            source="whatsapp",
            estimated_value=850.0,
            notes="Customer has infant at home, priority dispatch approved.",
        )
        db.add(lead1)
        db.flush()

        db.add(Appointment(
            business_id=business.id,
            lead_id=lead1.id,
            external_event_id="evt_gcal_demo_101",
            calendar_provider="google_calendar",
            start_time=now + timedelta(days=1, hours=2),
            end_time=now + timedelta(days=1, hours=3),
            status="confirmed",
            customer_name="Sarah Jenkins",
            customer_contact="+1 (512) 555-9821",
            service="AC Emergency Repair",
            notes="Outdoor fan motor check and capacitor testing",
        ))

        # Messages for conv1
        db.add(Message(conversation_id=conv1.id, sender_type="customer", content="Hi! Our AC just started blowing warm air and the outside unit is making a terrible humming noise.", created_at=now - timedelta(minutes=60)))
        db.add(Message(conversation_id=conv1.id, sender_type="ai", content="Hello Sarah! I'm so sorry to hear that, especially in this Texas heat. I've logged this as an emergency diagnostic request. Would you like me to book our earliest available opening tomorrow morning at 10:00 AM?", created_at=now - timedelta(minutes=58)))
        db.add(Message(conversation_id=conv1.id, sender_type="customer", content="Yes please, 10 AM tomorrow is perfect. My address is 3402 Scenic View, Westlake Hills.", created_at=now - timedelta(minutes=50)))
        db.add(Message(conversation_id=conv1.id, sender_type="ai", content="Appointment confirmed for tomorrow at 10:00 AM! Tech David is assigned. You'll receive a text tracking link when he's on the way.", created_at=now - timedelta(minutes=45)))

        # Lead 2: Warm / Human Handover
        conv2 = Conversation(
            business_id=business.id,
            agent_id=agent.id,
            customer_id="web_sess_robert_miller",
            customer_name="Robert Miller",
            channel="website_chat",
            status="human_handling",
            last_message_preview="Dispatcher Marcus has taken over this conversation.",
            last_message_at=now - timedelta(hours=2),
        )
        db.add(conv2)
        db.flush()

        lead2 = Lead(
            business_id=business.id,
            conversation_id=conv2.id,
            name="Robert Miller",
            phone="+1 (512) 555-4412",
            email="rmiller@austinlaw.com",
            service="Tankless Water Heater Installation",
            problem="Looking to replace 15-year old 50-gallon tank with Navien tankless system for 4-bathroom house.",
            location="Austin, TX 78703",
            intent="estimate",
            urgency="medium",
            score=75,
            status="human_review",
            source="website_chat",
            estimated_value=3200.0,
            notes="Requires commercial size quote.",
        )
        db.add(lead2)
        db.flush()

        # Messages for conv2
        db.add(Message(conversation_id=conv2.id, sender_type="customer", content="Hello, I need an estimate for installing a high-capacity Navien tankless water heater.", created_at=now - timedelta(hours=3)))
        db.add(Message(conversation_id=conv2.id, sender_type="ai", content="Hi Robert! Navien tankless systems are fantastic. Typical installations range from $2,400 to $3,800 with 10-year warranty. Can I have our master plumbing specialist call you with exact sizing?", created_at=now - timedelta(hours=2, minutes=58)))
        db.add(Message(conversation_id=conv2.id, sender_type="customer", content="Sure, my number is 512-555-4412. Can I speak with Marcus?", created_at=now - timedelta(hours=2, minutes=10)))
        db.add(Message(conversation_id=conv2.id, sender_type="human", content="Hi Robert, Marcus here from Apex master plumbing! I see you have 4 bathrooms. Let me check our gas line specs for you.", created_at=now - timedelta(hours=2)))

        # Lead 3: Nurturing / Follow-up active
        conv3 = Conversation(
            business_id=business.id,
            agent_id=agent.id,
            customer_id="+15125557731",
            customer_name="Elena Vance",
            channel="whatsapp",
            status="ai_handling",
            last_message_preview="Hi Elena! Following up to see if you wanted to schedule your seasonal tune-up?",
            last_message_at=now - timedelta(days=1),
        )
        db.add(conv3)
        db.flush()

        lead3 = Lead(
            business_id=business.id,
            conversation_id=conv3.id,
            name="Elena Vance",
            phone="+1 (512) 555-7731",
            service="Complete HVAC Seasonal Tune-up",
            intent="maintenance",
            urgency="low",
            score=55,
            status="nurturing",
            source="whatsapp",
            estimated_value=189.0,
        )
        db.add(lead3)
        db.flush()

        # Follow-up task
        db.add(FollowUp(
            business_id=business.id,
            lead_id=lead3.id,
            conversation_id=conv3.id,
            scheduled_for=now + timedelta(days=2),
            attempt_number=2,
            status="scheduled",
            message="Hi Elena! Just wanted to let you know our $189 tune-up special is ending Friday. Let us know if you'd like us to hold a spot for you!",
        ))

        db.commit()
        print("Demo seed data created successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
