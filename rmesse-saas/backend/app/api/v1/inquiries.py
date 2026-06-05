from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import assert_shop_in_org, get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.draft import DraftOut
from app.schemas.inquiry import InquiryOut
from app.services import audit
from app.services.draft_composer import generate_draft_for_inquiry

router = APIRouter()


def _scoped_inquiry(inquiry_id: int, db: Session, user: User) -> Inquiry:
    inq = (
        db.query(Inquiry)
        .join(Shop, Inquiry.shop_id == Shop.id)
        .filter(Inquiry.id == inquiry_id, Shop.organization_id == user.organization_id)
        .first()
    )
    if not inq:
        raise HTTPException(404, "Inquiry not found")
    return inq


@router.get("", response_model=list[InquiryOut])
def list_inquiries(
    shop_id: int | None = None,
    status: InquiryStatus | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Inquiry]:
    q = (
        db.query(Inquiry)
        .join(Shop, Inquiry.shop_id == Shop.id)
        .filter(Shop.organization_id == user.organization_id)
    )
    if shop_id is not None:
        assert_shop_in_org(db, shop_id, user.organization_id)
        q = q.filter(Inquiry.shop_id == shop_id)
    if status is not None:
        q = q.filter(Inquiry.status == status)
    return q.order_by(Inquiry.received_at.desc().nullslast(), Inquiry.id.desc()).limit(200).all()


@router.get("/{inquiry_id}", response_model=InquiryOut)
def get_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Inquiry:
    return _scoped_inquiry(inquiry_id, db, user)


@router.post("/{inquiry_id}/generate-draft", response_model=DraftOut)
@limiter.limit("30/minute")
async def generate_draft(
    request: Request,
    inquiry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DraftOut:
    inq = _scoped_inquiry(inquiry_id, db, user)
    draft = await generate_draft_for_inquiry(db, inq)
    audit.write(
        action="draft.generate",
        organization_id=user.organization_id,
        user_id=user.id,
        target_type="draft",
        target_id=draft.id,
        meta={"inquiry_id": inq.id, "provider": draft.ai_provider, "model": draft.ai_model},
        request=request,
    )
    return DraftOut.model_validate(draft)


@router.get("/{inquiry_id}/drafts", response_model=list[DraftOut])
def list_inquiry_drafts(
    inquiry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DraftOut]:
    inq = _scoped_inquiry(inquiry_id, db, user)
    return [DraftOut.model_validate(d) for d in inq.drafts]
