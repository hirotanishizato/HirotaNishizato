from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import assert_shop_in_org, get_current_user
from app.db.session import get_db
from app.models.delivery_rule import DeliveryRule
from app.models.shop import Shop
from app.models.user import User
from app.schemas.delivery_rule import DeliveryRuleCreate, DeliveryRuleOut, DeliveryRuleUpdate

router = APIRouter()


def _scoped(rule_id: int, db: Session, user: User) -> DeliveryRule:
    r = (
        db.query(DeliveryRule)
        .join(Shop, DeliveryRule.shop_id == Shop.id)
        .filter(DeliveryRule.id == rule_id, Shop.organization_id == user.organization_id)
        .first()
    )
    if not r:
        raise HTTPException(404, "Rule not found")
    return r


@router.get("", response_model=list[DeliveryRuleOut])
def list_rules(
    shop_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DeliveryRule]:
    assert_shop_in_org(db, shop_id, user.organization_id)
    return (
        db.query(DeliveryRule)
        .filter(DeliveryRule.shop_id == shop_id)
        .order_by(DeliveryRule.priority.desc(), DeliveryRule.id)
        .all()
    )


@router.post("", response_model=DeliveryRuleOut, status_code=201)
def create_rule(
    payload: DeliveryRuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeliveryRule:
    assert_shop_in_org(db, payload.shop_id, user.organization_id)
    r = DeliveryRule(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{rule_id}", response_model=DeliveryRuleOut)
def update_rule(
    rule_id: int,
    payload: DeliveryRuleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeliveryRule:
    r = _scoped(rule_id, db, user)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{rule_id}", status_code=204)
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    r = _scoped(rule_id, db, user)
    db.delete(r)
    db.commit()
