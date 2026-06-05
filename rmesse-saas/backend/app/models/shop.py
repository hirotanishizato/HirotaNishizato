from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Shop(Base, TimestampMixin):
    """1つの楽天店舗。RMS APIの認証情報を保持。
    将来 Yahoo, Amazon 等の別モール追加に備え `platform` カラムを用意。
    """

    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(32), default="rakuten", nullable=False)
    shop_code: Mapped[str | None] = mapped_column(String(64))

    # RMS の serviceSecret / licenseKey は暗号化保存（現状プレーンだが将来対応する前提）
    rms_service_secret: Mapped[str | None] = mapped_column(Text)
    rms_license_key: Mapped[str | None] = mapped_column(Text)

    # AI の挙動を店舗ごとにオーバーライドしたい場合
    ai_persona: Mapped[str | None] = mapped_column(Text)  # 「丁寧な口調で…」など
    ai_signature: Mapped[str | None] = mapped_column(Text)  # 末尾の署名

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # 自動同期 (バックグラウンドジョブ)
    auto_sync_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_sync_count: Mapped[int | None] = mapped_column(Integer)
    last_sync_error: Mapped[str | None] = mapped_column(Text)

    organization: Mapped["Organization"] = relationship(back_populates="shops")  # noqa: F821
    inquiries: Mapped[list["Inquiry"]] = relationship(back_populates="shop", cascade="all,delete")  # noqa: F821
    templates: Mapped[list["Template"]] = relationship(back_populates="shop", cascade="all,delete")  # noqa: F821
    manuals: Mapped[list["Manual"]] = relationship(back_populates="shop", cascade="all,delete")  # noqa: F821
    delivery_rules: Mapped[list["DeliveryRule"]] = relationship(  # noqa: F821
        back_populates="shop", cascade="all,delete"
    )
