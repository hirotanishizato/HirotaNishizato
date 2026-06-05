"""slowapi ベースのレートリミッタ。
- 未認証時: IPアドレス単位
- 認証済時: user.id 単位 (任意のキー関数を渡せる)
"""
from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import decode_token


def _key_func(request: Request) -> str:
    """Authorization ヘッダがあれば user.id、無ければIP。"""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
        payload = decode_token(token)
        if payload and payload.get("sub"):
            return f"user:{payload['sub']}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=_key_func, default_limits=["200/minute"])
