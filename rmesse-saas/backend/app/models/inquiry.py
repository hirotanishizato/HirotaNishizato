import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class InquiryStatus(str, enum.Enum):
    NEW = "new"
    DRAFTED = "drafted"  # AI下書きあり
    REPLIED = "replied"  # 返信済み
    CLOSED = "closed"
    NEEDS_HUMAN = "needs_human"  # AIが自信ない / エスカレ


class Inquiry(Base, TimestampMixin):
    """R-Messe から取得した問い合わせ1件。"""

    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)

    # RMS 側の一意ID。プロバイダ移植性のため文字列。
    external_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    subject: Mapped[str | None] = mapped_column(String(512))
    body: Mapped[str] = mapped_column(Text, nullable=False)

    customer_name: Mapped[str | None] = mapped_column(String(255))
    customer_email: Mapped[str | None] = mapped_column(String(255))

    # 紐づく商品/注文 (オプション、RMSから取れるなら入れる)
    product_external_id: Mapped[str | None] = mapped_column(String(128), index=True)
    order_external_id: Mapped[str | None] = mapped_column(String(128), index=True)

    status: Mapped[InquiryStatus] = mapped_column(
        Enum(InquiryStatus, native_enum=False), default=InquiryStatus.NEW, nullable=False
    )

    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    shop: Mapped["Shop"] = relationship(back_populates="inquiries")  # noqa: F821
    drafts: Mapped[list["Draft"]] = relationship(  # noqa: F821
        back_populates="inquiry", cascade="all,delete", order_by="Draft.created_at.desc()"
    )
