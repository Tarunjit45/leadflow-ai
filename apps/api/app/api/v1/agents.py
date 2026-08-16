from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, Agent, AgentTool
from apps.api.app.schemas.schemas import AgentOut, AgentUpdate, AgentToolOut, AgentToolUpdate

router = APIRouter(prefix="/agents", tags=["AI Agents"])


@router.get("/current", response_model=AgentOut)
def get_agent(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        agent = Agent(
            business_id=business.id,
            name="LeadFlow Sales & Booking Agent",
            role="AI Sales & Dispatch Assistant",
            status="active",
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
    return AgentOut.model_validate(agent)


@router.patch("/current", response_model=AgentOut)
def update_agent(
    payload: AgentUpdate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    db.commit()
    db.refresh(agent)
    return AgentOut.model_validate(agent)


@router.get("/tools", response_model=List[AgentToolOut])
def get_agent_tools(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        return []
    
    tools = db.query(AgentTool).filter(AgentTool.agent_id == agent.id).all()
    if not tools:
        # Seed default tools for agent
        default_tool_specs = [
            ("qualify_and_update_lead", True, "read_write"),
            ("get_calendar_availability", True, "read_only"),
            ("book_appointment", True, "read_write"),
            ("human_handoff", True, "read_write"),
            ("notify_owner", True, "read_write"),
        ]
        created_tools = []
        for name, enabled, perm in default_tool_specs:
            t = AgentTool(agent_id=agent.id, tool_name=name, enabled=enabled, permission_level=perm)
            db.add(t)
            created_tools.append(t)
        db.commit()
        return [AgentToolOut.model_validate(t) for t in created_tools]

    return [AgentToolOut.model_validate(t) for t in tools]


@router.put("/tools", response_model=List[AgentToolOut])
def update_agent_tools(
    payloads: List[AgentToolUpdate],
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.business_id == business.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    updated_tools = []
    for item in payloads:
        tool = db.query(AgentTool).filter(
            AgentTool.agent_id == agent.id,
            AgentTool.tool_name == item.tool_name
        ).first()
        if not tool:
            tool = AgentTool(
                agent_id=agent.id,
                tool_name=item.tool_name,
                enabled=item.enabled,
                permission_level=item.permission_level or "read_write",
                configuration=item.configuration or {},
            )
            db.add(tool)
        else:
            tool.enabled = item.enabled
            if item.permission_level:
                tool.permission_level = item.permission_level
            if item.configuration:
                tool.configuration = item.configuration
        updated_tools.append(tool)

    db.commit()
    return [AgentToolOut.model_validate(t) for t in updated_tools]
