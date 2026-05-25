from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import assert_shop_in_org, get_current_user
from app.db.session import get_db
from app.models.shop import Shop
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateOut, TemplateUpdate

router = APIRouter()


def _scoped(template_id: int, db: Session, user: User) -> Template:
    t = (
        db.query(Template)
        .join(Shop, Template.shop_id == Shop.id)
        .filter(Template.id == template_id, Shop.organization_id == user.organization_id)
        .first()
    )
    if not t:
        raise HTTPException(404, "Template not found")
    return t


@router.get("", response_model=list[TemplateOut])
def list_templates(
    shop_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Template]:
    assert_shop_in_org(db, shop_id, user.organization_id)
    return (
        db.query(Template)
        .filter(Template.shop_id == shop_id)
        .order_by(Template.priority.desc(), Template.id)
        .all()
    )


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Template:
    assert_shop_in_org(db, payload.shop_id, user.organization_id)
    t = Template(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Template:
    t = _scoped(template_id, db, user)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    t = _scoped(template_id, db, user)
    db.delete(t)
    db.commit()
