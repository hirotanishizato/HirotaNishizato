"""FastAPI 共通依存。
- 現在のユーザ取得
- Organization スコープのリソースアクセス制御
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.shop import Shop
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")
    try:
        user = db.get(User, int(user_id))
    except (TypeError, ValueError):
        user = None
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User inactive or not found")
    return user


def require_role(*allowed: UserRole):
    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user

    return _checker


def get_user_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Shop:
    """指定 shop_id が現在ユーザのOrganizationに属していることを保証して返す。"""
    shop = db.get(Shop, shop_id)
    if not shop or shop.organization_id != user.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shop not found")
    return shop


def assert_shop_in_org(db: Session, shop_id: int, organization_id: int) -> Shop:
    """サービス層からも使うショップ所属確認。"""
    shop = db.get(Shop, shop_id)
    if not shop or shop.organization_id != organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shop not found")
    return shop
