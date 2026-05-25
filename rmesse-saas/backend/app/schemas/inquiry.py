from datetime import datetime

from app.models.inquiry import InquiryStatus
from app.schemas.common import ORMModel


class InquiryOut(ORMModel):
    id: int
    shop_id: int
    external_id: str
    subject: str | None
    body: str
    customer_name: str | None
    customer_email: str | None
    product_external_id: str | None
    order_external_id: str | None
    status: InquiryStatus
    received_at: datetime | None
    created_at: datetime
