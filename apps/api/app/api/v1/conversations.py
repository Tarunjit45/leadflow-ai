from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business, get_current_user
from apps.api.app.models.models import Business, Conversation, Message, Lead, User
from apps.api.app.schemas.schemas import ConversationOut, MessageOut, MessageCreate, TakeoverPayload
from apps.api.app.agents.runtime import AgentRuntime

router = APIRouter(prefix="/conversations", tags=["Conversations & Inbox"])


@router.get("/", response_model=List[ConversationOut])
def list_conversations(
    status: Optional[str] = Query(None, description="Filter by ai_handling, human_handling, resolved"),
    channel: Optional[str] = Query(None, description="Filter by whatsapp, website_chat"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    query = db.query(Conversation).filter(Conversation.business_id == business.id)

    if status and status != "all":
        query = query.filter(Conversation.status == status)
    if channel and channel != "all":
        query = query.filter(Conversation.channel == channel)
    if search:
        query = query.filter(
            (Conversation.customer_name.ilike(f"%{search}%")) |
            (Conversation.customer_id.ilike(f"%{search}%"))
        )

    conversations = query.order_by(Conversation.last_message_at.desc()).all()
    return [ConversationOut.model_validate(c) for c in conversations]


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return ConversationOut.model_validate(conv)


@router.get("/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msg = Message(
        conversation_id=conversation_id,
        sender_type=payload.sender_type or "human",
        sender_id=current_user.id if payload.sender_type == "human" else None,
        content=payload.content,
        metadata_info=payload.metadata_info or {},
    )
    db.add(msg)
    conv.last_message_preview = payload.content[:150]
    conv.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    # If message was sent by customer (e.g. simulation or chat widget), trigger agent runtime
    if payload.sender_type == "customer":
        runtime = AgentRuntime(db)
        await runtime.process_incoming_message(
            business_id=business.id,
            conversation_id=conversation_id,
            customer_message_text=payload.content,
            sender_type="customer",
        )

    return MessageOut.model_validate(msg)


@router.post("/{conversation_id}/takeover", response_model=ConversationOut)
def toggle_takeover(
    conversation_id: str,
    payload: TakeoverPayload,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Allows business owner or human agent to take over the conversation or return handling to AI."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    conv.status = payload.status
    db.commit()
    db.refresh(conv)
    return ConversationOut.model_validate(conv)
