from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AIUsage(Base, TimestampMixin):
    """AI生成1回ごとの利用量レコード。Organization単位で集計し課金/アラートに使う。

    `tokens_in` / `tokens_out` は LLM のレスポンスから取得できれば値を入れ、
    取得不可なら 0 のまま記録する（呼び出し回数のみ）。
    """

    __tablename__ = "ai_usages"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    shop_id: Mapped[int | None] = mapped_column(
        ForeignKey("shops.id", ondelete="SET NULL"), index=True
    )
    draft_id: Mapped[int | None] = mapped_column(
        ForeignKey("drafts.id", ondelete="SET NULL"), index=True
    )

    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    model: Mapped[str] = mapped_column(String(64), nullable=False)

    tokens_in: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tokens_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
