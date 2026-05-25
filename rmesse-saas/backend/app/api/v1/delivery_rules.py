from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.delivery_rule import DeliveryRule
from app.schemas.delivery_rule import DeliveryRuleCreate, DeliveryRuleOut, DeliveryRuleUpdate

router = APIRouter()


@router.get("", response_model=list[DeliveryRuleOut])
def list_rules(shop_id: int, db: Session = Depends(get_db)) -> list[DeliveryRule]:
    return (
        db.query(DeliveryRule)
        .filter(DeliveryRule.shop_id == shop_id)
        .order_by(DeliveryRule.priority.desc(), DeliveryRule.id)
        .all()
    )


@router.post("", response_model=DeliveryRuleOut, status_code=201)
def create_rule(payload: DeliveryRuleCreate, db: Session = Depends(get_db)) -> DeliveryRule:
    r = DeliveryRule(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{rule_id}", response_model=DeliveryRuleOut)
def update_rule(
    rule_id: int, payload: DeliveryRuleUpdate, db: Session = Depends(get_db)
) -> DeliveryRule:
    r = db.get(DeliveryRule, rule_id)
    if not r:
        raise HTTPException(404, "Rule not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: int, db: Session = Depends(get_db)) -> None:
    r = db.get(DeliveryRule, rule_id)
    if not r:
        raise HTTPException(404, "Rule not found")
    db.delete(r)
    db.commit()
