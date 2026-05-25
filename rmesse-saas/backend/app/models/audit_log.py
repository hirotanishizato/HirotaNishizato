from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    """誰が・いつ・何をしたか の追跡記録。
    SaaSとして利用ログの開示・トラブル時の遡及が必要なので、
    主要な書き込み系操作はここに記録する。
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    # 例: "auth.login", "auth.signup", "draft.send", "draft.generate", "shop.create",
    #     "shop.update_credentials"
    action: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # 操作対象 (任意)。例: ("draft", 42), ("shop", 1)
    target_type: Mapped[str | None] = mapped_column(String(64), index=True)
    target_id: Mapped[str | None] = mapped_column(String(64))

    success: Mapped[bool] = mapped_column(default=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(Text)

    # 任意のメタデータ (含まれる値の機微性に注意。パスワード等は入れない)
    meta: Mapped[dict | None] = mapped_column(JSON)
