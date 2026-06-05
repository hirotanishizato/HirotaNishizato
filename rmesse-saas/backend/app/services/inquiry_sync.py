"""RMSから問い合わせをポーリングしてDBに取り込む。"""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.integrations.rms import get_rms_provider
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.shop import Shop

logger = logging.getLogger(__name__)


async def sync_inquiries_for_shop(db: Session, shop: Shop) -> list[Inquiry]:
    try:
        rms = get_rms_provider(shop)
        fetched = await rms.list_inquiries()
    except Exception as e:  # noqa: BLE001
        logger.exception("RMS sync failed for shop=%s", shop.id)
        shop.last_synced_at = datetime.now(UTC)
        shop.last_sync_error = str(e)[:500]
        db.commit()
        return []

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

    shop.last_synced_at = datetime.now(UTC)
    shop.last_sync_count = len(created)
    shop.last_sync_error = None
    db.commit()
    for inq in created:
        db.refresh(inq)
    return created
