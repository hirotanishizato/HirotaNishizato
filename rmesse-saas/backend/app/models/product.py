from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Product(Base, TimestampMixin):
    """RMS/商品ページから取得した商品情報のキャッシュ。
    問い合わせ生成時に毎回外部APIを叩くと遅いのでキャッシュ。
    """

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    external_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    name: Mapped[str | None] = mapped_column(String(512))
    url: Mapped[str | None] = mapped_column(String(1024))
    price: Mapped[int | None] = mapped_column()
    description: Mapped[str | None] = mapped_column(Text)

    # 任意の商品属性 (商品ページからスクレイプ/APIで取れた構造化情報)
    attributes: Mapped[dict | None] = mapped_column(JSON)
    raw_html_excerpt: Mapped[str | None] = mapped_column(Text)

    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
