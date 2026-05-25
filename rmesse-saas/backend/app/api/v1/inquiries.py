from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.inquiry import Inquiry, InquiryStatus
from app.schemas.draft import DraftOut
from app.schemas.inquiry import InquiryOut
from app.services.draft_composer import generate_draft_for_inquiry

router = APIRouter()


@router.get("", response_model=list[InquiryOut])
def list_inquiries(
    shop_id: int | None = None,
    status: InquiryStatus | None = None,
    db: Session = Depends(get_db),
) -> list[Inquiry]:
    q = db.query(Inquiry)
    if shop_id is not None:
        q = q.filter(Inquiry.shop_id == shop_id)
    if status is not None:
        q = q.filter(Inquiry.status == status)
    return q.order_by(Inquiry.received_at.desc().nullslast(), Inquiry.id.desc()).limit(200).all()


@router.get("/{inquiry_id}", response_model=InquiryOut)
def get_inquiry(inquiry_id: int, db: Session = Depends(get_db)) -> Inquiry:
    inq = db.get(Inquiry, inquiry_id)
    if not inq:
        raise HTTPException(404, "Inquiry not found")
    return inq


@router.post("/{inquiry_id}/generate-draft", response_model=DraftOut)
async def generate_draft(inquiry_id: int, db: Session = Depends(get_db)) -> DraftOut:
    inq = db.get(Inquiry, inquiry_id)
    if not inq:
        raise HTTPException(404, "Inquiry not found")
    draft = await generate_draft_for_inquiry(db, inq)
    return DraftOut.model_validate(draft)


@router.get("/{inquiry_id}/drafts", response_model=list[DraftOut])
def list_inquiry_drafts(inquiry_id: int, db: Session = Depends(get_db)) -> list[DraftOut]:
    inq = db.get(Inquiry, inquiry_id)
    if not inq:
        raise HTTPException(404, "Inquiry not found")
    return [DraftOut.model_validate(d) for d in inq.drafts]
