import enum

from sqlalchemy import JSON, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DraftStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"  # 人間チェック待ち
    APPROVED = "approved"
    EDITED = "edited"
    SENT = "sent"
    REJECTED = "rejected"


class Draft(Base, TimestampMixin):
    """AI が生成した返信下書き。1問い合わせに複数 (再生成) 持てる。"""

    __tablename__ = "drafts"

    id: Mapped[int] = mapped_column(primary_key=True)
    inquiry_id: Mapped[int] = mapped_column(ForeignKey("inquiries.id", ondelete="CASCADE"), index=True)

    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DraftStatus] = mapped_column(
        Enum(DraftStatus, native_enum=False), default=DraftStatus.PENDING_REVIEW, nullable=False
    )

    # 生成のトレーサビリティ
    ai_provider: Mapped[str | None] = mapped_column(Text)
    ai_model: Mapped[str | None] = mapped_column(Text)
    prompt_snapshot: Mapped[dict | None] = mapped_column(JSON)  # システムプロンプト + 取込情報
    sources: Mapped[dict | None] = mapped_column(JSON)  # 参照したテンプレ/マニュアル/納期ID等
    confidence: Mapped[float | None] = mapped_column()

    inquiry: Mapped["Inquiry"] = relationship(back_populates="drafts")  # noqa: F821
