"""RMSから問い合わせをポーリングしてDBに取り込む。"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.integrations.rms import get_rms_provider
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.shop import Shop


async def sync_inquiries_for_shop(db: Session, shop: Shop) -> list[Inquiry]:
    rms = get_rms_provider(shop)
    fetched = await rms.list_inquiries()

    created: list[Inquiry] = []
    for dto in fetched:
        exists = (
            db.query(Inquiry)
            .filter(Inquiry.shop_id == shop.id, Inquiry.external_id == dto.external_id)
            .first()
        )
        if exists:
            continue
        inq = Inquiry(
            shop_id=shop.id,
            external_id=dto.external_id,
            subject=dto.subject,
            body=dto.body,
            customer_name=dto.customer_name,
            customer_email=dto.customer_email,
            product_external_id=dto.product_external_id,
            order_external_id=dto.order_external_id,
            received_at=dto.received_at,
            status=InquiryStatus.NEW,
        )
        db.add(inq)
        created.append(inq)
    db.commit()
    for inq in created:
        db.refresh(inq)
    return created
