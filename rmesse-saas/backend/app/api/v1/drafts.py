from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.rms import get_rms_provider
from app.models.draft import Draft, DraftStatus
from app.models.inquiry import InquiryStatus
from app.schemas.draft import DraftOut, DraftUpdate

router = APIRouter()


@router.get("/{draft_id}", response_model=DraftOut)
def get_draft(draft_id: int, db: Session = Depends(get_db)) -> Draft:
    d = db.get(Draft, draft_id)
    if not d:
        raise HTTPException(404, "Draft not found")
    return d


@router.patch("/{draft_id}", response_model=DraftOut)
def update_draft(draft_id: int, payload: DraftUpdate, db: Session = Depends(get_db)) -> Draft:
    d = db.get(Draft, draft_id)
    if not d:
        raise HTTPException(404, "Draft not found")
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
async def send_draft(draft_id: int, db: Session = Depends(get_db)) -> Draft:
    d = db.get(Draft, draft_id)
    if not d:
        raise HTTPException(404, "Draft not found")
    if d.status == DraftStatus.SENT:
        raise HTTPException(400, "Already sent")

    inquiry = d.inquiry
    rms = get_rms_provider(inquiry.shop)
    ok = await rms.send_reply(inquiry.external_id, d.body)
    if not ok:
        raise HTTPException(502, "Failed to send via RMS")

    d.status = DraftStatus.SENT
    inquiry.status = InquiryStatus.REPLIED
    db.commit()
    db.refresh(d)
    return d
