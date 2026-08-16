import json
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.idempotency import is_event_processed, mark_event_processed
from apps.api.app.integrations.whatsapp import WhatsAppProvider
from apps.api.app.integrations.payments import get_payment_provider
from apps.api.app.models.models import Business, Conversation, Message, Subscription
from apps.api.app.agents.runtime import AgentRuntime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["External Webhooks"])


# --- WhatsApp Webhooks ---
@router.get("/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
):
    """Handles Meta's initial Webhook Challenge handshake."""
    whatsapp = WhatsAppProvider()
    challenge = whatsapp.verify_webhook_challenge(
        mode=hub_mode or "",
        token=hub_verify_token or "",
        challenge=hub_challenge or "",
    )
    if challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification token mismatch.")


@router.post("/whatsapp")
async def receive_whatsapp_message(
    request: Request,
    db: Session = Depends(get_db),
):
    """Processes inbound Meta WhatsApp Cloud API webhooks with idempotency."""
    raw_body = await request.body()
    sig_header = request.headers.get("X-Hub-Signature-256")
    
    whatsapp = WhatsAppProvider()
    if not whatsapp.verify_payload_signature(raw_body, sig_header):
        raise HTTPException(status_code=403, detail="Invalid webhook signature.")

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return {"status": "ignored_invalid_json"}

    entry_list = data.get("entry", [])
    if not entry_list:
        return {"status": "ok_empty_entry"}

    for entry in entry_list:
        for change in entry.get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            contact_name = contacts[0].get("profile", {}).get("name") if contacts else "WhatsApp Lead"
            phone_number_id = value.get("metadata", {}).get("phone_number_id")

            for msg in messages:
                msg_id = msg.get("id")
                from_number = msg.get("from")
                msg_type = msg.get("type")

                if is_event_processed("whatsapp", msg_id):
                    logger.info(f"WhatsApp message {msg_id} already processed. Skipping duplicate.")
                    continue
                mark_event_processed("whatsapp", msg_id)

                if msg_type != "text":
                    continue

                text_content = msg.get("text", {}).get("body", "").strip()
                if not text_content:
                    continue

                business = db.query(Business).first()
                if not business:
                    continue

                conv = db.query(Conversation).filter(
                    Conversation.business_id == business.id,
                    Conversation.customer_id == from_number,
                    Conversation.channel == "whatsapp"
                ).first()

                if not conv:
                    conv = Conversation(
                        business_id=business.id,
                        customer_id=from_number,
                        customer_name=contact_name,
                        channel="whatsapp",
                        status="ai_handling",
                        last_message_preview=text_content[:150],
                    )
                    db.add(conv)
                    db.commit()
                    db.refresh(conv)

                customer_msg = Message(
                    conversation_id=conv.id,
                    sender_type="customer",
                    sender_id=from_number,
                    channel_message_id=msg_id,
                    content=text_content,
                )
                db.add(customer_msg)
                conv.last_message_at = datetime.now(timezone.utc)
                conv.last_message_preview = text_content[:150]
                db.commit()

                runtime = AgentRuntime(db)
                agent_res = await runtime.process_incoming_message(
                    business_id=business.id,
                    conversation_id=conv.id,
                    customer_message_text=text_content,
                    sender_type="customer",
                )

                if agent_res.get("response_text"):
                    await whatsapp.send_text_message(from_number, agent_res["response_text"])

    return {"status": "processed"}


# --- Razorpay Webhooks ---
@router.post("/razorpay")
async def receive_razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Processes Razorpay subscription, payment, and lifecycle webhook events."""
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    provider = get_payment_provider("razorpay")
    if not provider.verify_webhook_signature(raw_body, signature):
        logger.error("Invalid Razorpay webhook signature")
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature.")

    event = provider.parse_webhook_event(raw_body, signature)
    event_id = event.get("event_id")
    event_type = event.get("event_type")

    if is_event_processed("razorpay", event_id):
        return {"status": "already_processed"}
    mark_event_processed("razorpay", event_id)

    business_id = event.get("business_id")
    sub_id = event.get("provider_subscription_id")
    norm_status = event.get("normalized_status", "active")
    plan_tier = event.get("plan_tier", "starter")

    # Find subscription by business_id or provider_subscription_id
    sub = None
    if business_id:
        sub = db.query(Subscription).filter(Subscription.business_id == business_id).first()
    elif sub_id:
        sub = db.query(Subscription).filter(
            (Subscription.provider_subscription_id == sub_id) | (Subscription.subscription_id == sub_id)
        ).first()

    if not sub:
        # Fallback to demo business if available
        sub = db.query(Subscription).first()

    if sub:
        sub.provider = "razorpay"
        sub.status = norm_status
        sub.plan_tier = plan_tier
        if sub_id:
            sub.provider_subscription_id = sub_id
        if event.get("provider_customer_id"):
            sub.provider_customer_id = event.get("provider_customer_id")
        if event.get("currency"):
            sub.currency = event.get("currency")
        if event.get("amount"):
            sub.amount = event.get("amount")

        is_growth = plan_tier.lower() == "growth"
        sub.messages_limit = 2500 if is_growth else 1000
        sub.appointments_limit = 250 if is_growth else 100
        db.commit()

    return {"status": "success", "provider": "razorpay", "event": event_type, "normalized_status": norm_status}


# --- Stripe Webhooks ---
@router.post("/stripe")
async def receive_stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Processes Stripe subscription and billing lifecycle events."""
    raw_body = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    provider = get_payment_provider("stripe")
    if not provider.verify_webhook_signature(raw_body, sig_header):
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.")

    event = provider.parse_webhook_event(raw_body, sig_header)
    event_id = event.get("event_id")
    event_type = event.get("event_type")

    if is_event_processed("stripe", event_id):
        return {"status": "already_processed"}
    mark_event_processed("stripe", event_id)

    business_id = event.get("business_id")
    sub_id = event.get("provider_subscription_id")
    norm_status = event.get("normalized_status", "active")
    plan_tier = event.get("plan_tier", "starter")

    sub = None
    if business_id:
        sub = db.query(Subscription).filter(Subscription.business_id == business_id).first()
    elif sub_id:
        sub = db.query(Subscription).filter(
            (Subscription.provider_subscription_id == sub_id) | (Subscription.subscription_id == sub_id)
        ).first()

    if not sub:
        sub = db.query(Subscription).first()

    if sub:
        sub.provider = "stripe"
        sub.status = norm_status
        sub.plan_tier = plan_tier
        if sub_id:
            sub.provider_subscription_id = sub_id
            sub.subscription_id = sub_id
        if event.get("provider_customer_id"):
            sub.provider_customer_id = event.get("provider_customer_id")
            sub.customer_id = event.get("provider_customer_id")
        
        is_growth = plan_tier.lower() == "growth"
        sub.messages_limit = 2500 if is_growth else 1000
        sub.appointments_limit = 250 if is_growth else 100
        db.commit()

    return {"status": "success", "provider": "stripe", "event": event_type, "normalized_status": norm_status}
