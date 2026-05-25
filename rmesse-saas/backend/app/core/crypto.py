"""保存時の秘匿情報暗号化 (Fernet/AES-128-CBC + HMAC)。

`SECRET_ENCRYPTION_KEY` (32バイトのurlsafe-base64) を `.env` に設定するのが本筋。
未設定時は `JWT_SECRET` から鍵を派生させる（開発・初期導入の利便性のため）。
本番では必ず独立した強い鍵を設定し、KMS等で管理すること。
"""
from __future__ import annotations

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _derive_key(seed: str) -> bytes:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


@lru_cache
def _fernet() -> Fernet:
    settings = get_settings()
    raw = settings.secret_encryption_key.strip()
    if raw:
        try:
            return Fernet(raw.encode("ascii"))
        except (ValueError, TypeError):
            # 与えられた値が urlsafe-base64 32B でなければ派生に倒す
            return Fernet(_derive_key(raw))
    return Fernet(_derive_key(settings.jwt_secret))


# 暗号文に付ける接頭辞。プレーン→暗号化への移行時に区別するため。
_PREFIX = "enc::"


def encrypt(plaintext: str | None) -> str | None:
    if plaintext is None or plaintext == "":
        return plaintext
    if plaintext.startswith(_PREFIX):  # 二重暗号化を防止
        return plaintext
    token = _fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")
    return f"{_PREFIX}{token}"


def decrypt(value: str | None) -> str | None:
    if value is None or value == "":
        return value
    if not value.startswith(_PREFIX):
        # 旧プレーン保存値を透過的に返す（マイグレーション期間用）
        return value
    token = value[len(_PREFIX):]
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        return None
