from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateOut, TemplateUpdate

router = APIRouter()


@router.get("", response_model=list[TemplateOut])
def list_templates(shop_id: int, db: Session = Depends(get_db)) -> list[Template]:
    return (
        db.query(Template)
        .filter(Template.shop_id == shop_id)
        .order_by(Template.priority.desc(), Template.id)
        .all()
    )


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)) -> Template:
    t = Template(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)
) -> Template:
    t = db.get(Template, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)) -> None:
    t = db.get(Template, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    db.delete(t)
    db.commit()
