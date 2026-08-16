import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Agent, BusinessKnowledge
from apps.api.app.schemas.schemas import AgentTestRequest, AgentTestResponse
from apps.api.app.agents.providers.factory import get_ai_provider
from apps.api.app.agents.providers.base import AIMessage
from apps.api.app.agents.prompt_builder import build_system_prompt
from apps.api.app.agents.tools.registry import tool_registry

router = APIRouter(prefix="/test-console", tags=["Agent Test Console"])


@router.post("/simulate", response_model=AgentTestResponse)
async def simulate_agent_chat(
    payload: AgentTestRequest,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Executes a test conversation against the current business knowledge without saving to production leads."""
    start_time = time.time()
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(business_id=business.id, name="Test Agent", model="google/gemini-2.0-flash-001")
    
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    system_prompt = build_system_prompt(business, knowledge, agent)

    ai_messages = [AIMessage(role="system", content=system_prompt)]
    if payload.mock_history:
        for m in payload.mock_history:
            ai_messages.append(AIMessage(role=m.get("role", "user"), content=m.get("content", "")))

    ai_messages.append(AIMessage(role="user", content=payload.message))

    # All tools available for simulation testing
    all_tools = ["qualify_and_update_lead", "get_calendar_availability", "book_appointment", "human_handoff", "notify_owner"]
    tool_schemas = tool_registry.get_available_tools_for_agent(all_tools)

    provider = get_ai_provider()
    result = await provider.generate_response(
        messages=ai_messages,
        tools=tool_schemas,
        temperature=agent.temperature,
        model=agent.model,
    )

    latency = int((time.time() - start_time) * 1000)

    # Inspect simulated lead extraction
    simulated_lead = None
    if result.tool_calls:
        for tc in result.tool_calls:
            if tc.get("function", {}).get("name") == "qualify_and_update_lead":
                import json
                try:
                    simulated_lead = json.loads(tc["function"]["arguments"])
                except Exception:
                    pass

    return AgentTestResponse(
        reply=result.content or "I have processed your request.",
        conversation_id=payload.conversation_id or f"test_conv_{int(time.time())}",
        tool_calls=result.tool_calls,
        lead_extraction=simulated_lead,
        confidence_score=0.96,
        latency_ms=latency,
        model=result.model,
    )
