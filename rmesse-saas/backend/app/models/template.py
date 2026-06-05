from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Template(Base, TimestampMixin):
    """クライアント独自の返信テンプレート。
    `match_keywords` (JSON list[str]) や `category` を使い、AIが該当を選定して下書きに利用。
    """

    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(128), index=True)  # 例: "配送", "返品"
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # 自然言語マッチ用。AIに渡してマッチ判定。
    match_keywords: Mapped[list | None] = mapped_column(JSON)  # ["送料", "発送日"]
    description: Mapped[str | None] = mapped_column(Text)  # AI用のメタ説明

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    priority: Mapped[int] = mapped_column(default=0, nullable=False)

    shop: Mapped["Shop"] = relationship(back_populates="templates")  # noqa: F821
