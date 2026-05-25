"""DB初期化スクリプト（開発用）。
本番では `alembic revision --autogenerate` で正しいマイグレーションを生成して使う。
"""
from app.db.base import Base
from app.db.session import engine
from app.models import *  # noqa: F401,F403


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    main()
