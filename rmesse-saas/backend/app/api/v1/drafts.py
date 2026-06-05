from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.integrations.rms import get_rms_provider
from app.models.draft import Draft, DraftStatus
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.shop import Shop
from app.models.user import User
from app.schemas.draft import DraftOut, DraftUpdate
from app.services import audit

router = APIRouter()


def _scoped_draft(draft_id: int, db: Session, user: User) -> Draft:
    d = (
        db.query(Draft)
        .join(Inquiry, Draft.inquiry_id == Inquiry.id)
        .join(Shop, Inquiry.shop_id == Shop.id)
        .filter(Draft.id == draft_id, Shop.organization_id == user.organization_id)
        .first()
    )
    if not d:
        raise HTTPException(404, "Draft not found")
    return d


@router.get("/{draft_id}", response_model=DraftOut)
def get_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Draft:
    return _scoped_draft(draft_id, db, user)


@router.patch("/{draft_id}", response_model=DraftOut)
def update_draft(
    draft_id: int,
    payload: DraftUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Draft:
    d = _scoped_draft(draft_id, db, user)
    if payload.body is not None and payload.body != d.body:
        d.body = payload.body
        if d.status == DraftStatus.PENDING_REVIEW:
            d.status = DraftStatus.EDITED
    if payload.status is not None:
        d.status = payload.status
    db.commit()
    db.refresh(d)
    return d


@router.post("/{draft_id}/send", response_model=DraftOut)
async def send_draft(
    request: Request,
    draft_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Draft:
    d = _scoped_draft(draft_id, db, user)
    if d.status == DraftStatus.SENT:
        raise HTTPException(400, "Already sent")

    inquiry = d.inquiry
    rms = get_rms_provider(inquiry.shop)
    ok = await rms.send_reply(inquiry.external_id, d.body)
    if not ok:
        audit.write(
            action="draft.send",
            organization_id=user.organization_id,
            user_id=user.id,
            target_type="draft",
            target_id=d.id,
            success=False,
            meta={"inquiry_id": inquiry.id, "external_id": inquiry.external_id},
            request=request,
        )
        raise HTTPException(502, "Failed to send via RMS")

    d.status = DraftStatus.SENT
    inquiry.status = InquiryStatus.REPLIED
    db.commit()
    db.refresh(d)
    audit.write(
        action="draft.send",
        organization_id=user.organization_id,
        user_id=user.id,
        target_type="draft",
        target_id=d.id,
        meta={"inquiry_id": inquiry.id, "external_id": inquiry.external_id},
        request=request,
    )
    return d
