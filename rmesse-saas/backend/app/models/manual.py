from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Manual(Base, TimestampMixin):
    """商品/ソフトのマニュアル。商品ページに無い情報を補完する。
    `applies_to_product_external_ids` を指定すれば特定商品にのみ紐付け、
    指定なしならショップ共通として全問い合わせの参考に使う。
    """

    __tablename__ = "manuals"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # 全商品共通なら null、特定商品向けなら external_id のリスト
    applies_to_product_external_ids: Mapped[list | None] = mapped_column(JSON)
    tags: Mapped[list | None] = mapped_column(JSON)

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    shop: Mapped["Shop"] = relationship(back_populates="manuals")  # noqa: F821
