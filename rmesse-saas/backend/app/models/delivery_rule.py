from sqlalchemy import ForeignKey, JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DeliveryRule(Base, TimestampMixin):
    """納期ルール。
    例: 平日14:00までの注文は当日発送、それ以降は翌営業日発送。土日祝は休業。
    柔軟性のため一部は JSON で表現。AIは構造化テキストとしてプロンプトに含める。
    """

    __tablename__ = "delivery_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # カットオフ (例: "14:00") と適用曜日 (例: ["mon","tue","wed","thu","fri"])
    cutoff_time: Mapped[str | None] = mapped_column(String(8))
    business_days: Mapped[list | None] = mapped_column(JSON)

    # 発送までの営業日 (0 = 当日, 1 = 翌営業日)
    ship_within_business_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # 地域ごとの到着目安 (例: {"関東": "1日", "九州": "2日"})
    arrival_by_region: Mapped[dict | None] = mapped_column(JSON)

    # 休業日 (祝日や夏季休業など、ISO日付の配列)
    closed_dates: Mapped[list | None] = mapped_column(JSON)

    # 適用商品（null = ショップ全体）
    applies_to_product_external_ids: Mapped[list | None] = mapped_column(JSON)

    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    priority: Mapped[int] = mapped_column(default=0, nullable=False)

    shop: Mapped["Shop"] = relationship(back_populates="delivery_rules")  # noqa: F821
