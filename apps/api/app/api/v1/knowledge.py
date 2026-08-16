from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.api.deps import get_current_business
from apps.api.app.models.models import Business, BusinessKnowledge
from apps.api.app.schemas.schemas import BusinessKnowledgeOut, BusinessKnowledgeUpdate

router = APIRouter(prefix="/knowledge", tags=["Business Knowledge"])


@router.get("/", response_model=BusinessKnowledgeOut)
def get_knowledge(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(
            business_id=business.id,
            services=[
                {"name": "Standard Diagnostic", "description": "System testing and diagnosis", "price": "$99", "duration": 60}
            ],
            hours={"monday": {"open": "08:00", "close": "18:00", "closed": False}},
            service_areas=["Local Area"],
            faqs=[],
        )
        db.add(knowledge)
        db.commit()
        db.refresh(knowledge)
    return BusinessKnowledgeOut.model_validate(knowledge)


@router.put("/", response_model=BusinessKnowledgeOut)
def update_knowledge(
    payload: BusinessKnowledgeUpdate,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    knowledge = db.query(BusinessKnowledge).filter(BusinessKnowledge.business_id == business.id).first()
    if not knowledge:
        knowledge = BusinessKnowledge(business_id=business.id)
        db.add(knowledge)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(knowledge, field, value)

    db.commit()
    db.refresh(knowledge)
    return BusinessKnowledgeOut.model_validate(knowledge)
