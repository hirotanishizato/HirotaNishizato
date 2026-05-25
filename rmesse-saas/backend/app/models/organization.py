from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Organization(Base, TimestampMixin):
    """SaaSのテナント単位。1つの会社 = 1つの Organization。
    複数の楽天ショップ(Shop)、複数のユーザー(User)を束ねる。"""

    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), default="free", nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="organization", cascade="all,delete")  # noqa: F821
    shops: Mapped[list["Shop"]] = relationship(back_populates="organization", cascade="all,delete")  # noqa: F821
