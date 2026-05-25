from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Order(Base, TimestampMixin):
    """既存注文者からの問い合わせ時に参照する注文情報。"""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    external_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    customer_name: Mapped[str | None] = mapped_column(String(255))
    customer_email: Mapped[str | None] = mapped_column(String(255))

    ordered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str | None] = mapped_column(String(64))
    total_amount: Mapped[int | None] = mapped_column()

    # 注文に紐づく自由形式の納期情報（商品によっては書かれている）
    delivery_note: Mapped[str | None] = mapped_column(Text)

    # 配送先 (地域マッチに使用)
    shipping_region: Mapped[str | None] = mapped_column(String(64))
    shipping_address: Mapped[dict | None] = mapped_column(JSON)

    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all,delete"
    )


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)

    product_external_id: Mapped[str | None] = mapped_column(String(128), index=True)
    name: Mapped[str | None] = mapped_column(String(512))
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price: Mapped[int | None] = mapped_column()
    # 注文時に商品にひもづいていた納期テキスト（あれば）
    delivery_note: Mapped[str | None] = mapped_column(Text)

    order: Mapped["Order"] = relationship(back_populates="items")
