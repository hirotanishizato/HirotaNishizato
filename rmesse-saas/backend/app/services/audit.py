"""監査ログ書き込みのユーティリティ。
失敗時のcommitエラーで本処理が壊れないよう、独自トランザクションで保存する。
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def _request_info(request: Request | None) -> tuple[str | None, str | None]:
    if request is None:
        return None, None
    fwd = request.headers.get("x-forwarded-for")
    ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    return ip, ua


def write(
    *,
    action: str,
    organization_id: int | None = None,
    user_id: int | None = None,
    target_type: str | None = None,
    target_id: str | int | None = None,
    success: bool = True,
    meta: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    """ログ書き込み。常に専用セッションで実行し、例外は握りつぶす
    （監査の失敗で本処理を壊さない / 本処理の rollback に巻き込まれない）。
    """
    ip, ua = _request_info(request)
    db: Session = SessionLocal()
    try:
        entry = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            success=success,
            ip_address=ip,
            user_agent=ua,
            meta=meta,
        )
        db.add(entry)
        db.commit()
    except Exception:
        logger.exception("audit log write failed: action=%s", action)
        try:
            db.rollback()
        except Exception:  # noqa: BLE001, S110
            pass  # noqa: S110
    finally:
        db.close()
