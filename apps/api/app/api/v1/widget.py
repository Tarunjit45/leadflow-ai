from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.models.models import Business, Agent, Conversation, Message, BusinessKnowledge
from apps.api.app.agents.runtime import AgentRuntime

router = APIRouter(prefix="/widget", tags=["Website Chat Widget"])


@router.get("/config/{business_id}")
def get_widget_config(business_id: str, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")

    agent = db.query(Agent).filter(Agent.business_id == business_id).first()
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business_id).first()

    return {
        "business_id": business.id,
        "business_name": business.name,
        "agent_name": agent.name if agent else "AI Service Assistant",
        "agent_role": agent.role if agent else "Sales & Scheduling Specialist",
        "welcome_message": f"Hi! Welcome to {business.name}. How can we assist you with repairs, estimates, or service bookings today?",
        "primary_color": "#0284c7",
        "services": knowledge.services if knowledge else [],
    }


@router.post("/message/{business_id}")
async def handle_widget_message(
    business_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")

    customer_id = payload.get("customer_id") or payload.get("session_id") or "web_guest"
    customer_name = payload.get("customer_name") or "Website Visitor"
    message_text = payload.get("message", "").strip()
    conversation_id = payload.get("conversation_id")

    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    conv = None
    if conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.business_id == business.id
        ).first()

    if not conv:
        conv = Conversation(
            business_id=business.id,
            customer_id=customer_id,
            customer_name=customer_name,
            channel="website_chat",
            status="ai_handling",
            last_message_preview=message_text[:150],
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save customer message
    cust_msg = Message(
        conversation_id=conv.id,
        sender_type="customer",
        sender_id=customer_id,
        content=message_text,
    )
    db.add(cust_msg)
    conv.last_message_at = datetime.now(timezone.utc)
    conv.last_message_preview = message_text[:150]
    db.commit()

    # Trigger AgentRuntime
    runtime = AgentRuntime(db)
    agent_res = await runtime.process_incoming_message(
        business_id=business.id,
        conversation_id=conv.id,
        customer_message_text=message_text,
        sender_type="customer",
    )

    return {
        "conversation_id": conv.id,
        "reply": agent_res.get("response_text"),
        "status": agent_res.get("status"),
        "tool_calls": agent_res.get("tool_calls", []),
    }


@router.get("/embed.js")
def get_embed_script():
    """Serves the standalone website chat embed snippet."""
    js_code = """(function() {
    var scriptTag = document.currentScript;
    var businessId = scriptTag ? scriptTag.getAttribute('data-business-id') : 'default';
    var apiBase = scriptTag ? scriptTag.src.replace('/api/v1/widget/embed.js', '') : 'http://localhost:8000';

    var container = document.createElement('div');
    container.id = 'leadflow-widget-root';
    document.body.appendChild(container);

    var style = document.createElement('style');
    style.innerHTML = `
        .lf-widget-btn { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 50%; background: #0284c7; color: white; border: none; box-shadow: 0 4px 14px rgba(0,0,0,0.25); cursor: pointer; z-index: 999999; display: flex; align-items: center; justify-content: center; font-size: 26px; transition: transform 0.2s ease; }
        .lf-widget-btn:hover { transform: scale(1.08); background: #0369a1; }
        .lf-chat-modal { position: fixed; bottom: 96px; right: 24px; width: 380px; height: 560px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; display: none; flex-direction: column; overflow: hidden; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .lf-chat-header { background: #0f172a; color: #ffffff; padding: 16px; display: flex; align-items: center; justify-content: space-between; }
        .lf-chat-body { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
        .lf-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-break: break-word; }
        .lf-msg-ai { background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; align-self: flex-start; }
        .lf-msg-user { background: #0284c7; color: #ffffff; align-self: flex-end; }
        .lf-chat-footer { padding: 12px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; }
        .lf-chat-input { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; }
        .lf-chat-send { background: #0284c7; color: #ffffff; border: none; border-radius: 8px; padding: 0 16px; font-weight: 600; cursor: pointer; }
    `;
    document.head.appendChild(style);

    var sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
    var conversationId = null;

    container.innerHTML = `
        <button id="lf-toggle-btn" class="lf-widget-btn">💬</button>
        <div id="lf-chat-modal" class="lf-chat-modal">
            <div class="lf-chat-header">
                <div>
                    <strong id="lf-biz-name">LeadFlow Assistant</strong>
                    <div style="font-size: 11px; opacity: 0.8;">🟢 Online 24/7</div>
                </div>
                <button id="lf-close-btn" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>
            </div>
            <div id="lf-chat-messages" class="lf-chat-body">
                <div class="lf-msg lf-msg-ai">Hello! How can we help you today with service, questions, or appointments?</div>
            </div>
            <div class="lf-chat-footer">
                <input type="text" id="lf-input" class="lf-chat-input" placeholder="Type your message..." />
                <button id="lf-send-btn" class="lf-chat-send">Send</button>
            </div>
        </div>
    `;

    var toggleBtn = document.getElementById('lf-toggle-btn');
    var modal = document.getElementById('lf-chat-modal');
    var closeBtn = document.getElementById('lf-close-btn');
    var sendBtn = document.getElementById('lf-send-btn');
    var input = document.getElementById('lf-input');
    var messagesList = document.getElementById('lf-chat-messages');

    toggleBtn.onclick = function() {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    };
    closeBtn.onclick = function() { modal.style.display = 'none'; };

    function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        
        var userBubble = document.createElement('div');
        userBubble.className = 'lf-msg lf-msg-user';
        userBubble.innerText = text;
        messagesList.appendChild(userBubble);
        input.value = '';
        messagesList.scrollTop = messagesList.scrollHeight;

        fetch(apiBase + '/api/v1/widget/message/' + businessId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, session_id: sessionId, conversation_id: conversationId })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.conversation_id) conversationId = data.conversation_id;
            var aiBubble = document.createElement('div');
            aiBubble.className = 'lf-msg lf-msg-ai';
            aiBubble.innerText = data.reply || "Thank you. Our team will follow up shortly.";
            messagesList.appendChild(aiBubble);
            messagesList.scrollTop = messagesList.scrollHeight;
        })
        .catch(function() {
            var errBubble = document.createElement('div');
            errBubble.className = 'lf-msg lf-msg-ai';
            errBubble.innerText = "Message received. Our dispatcher will contact you.";
            messagesList.appendChild(errBubble);
        });
    }

    sendBtn.onclick = sendMessage;
    input.onkeydown = function(e) { if (e.key === 'Enter') sendMessage(); };
})();"""
    return Response(content=js_code, media_type="application/javascript")
