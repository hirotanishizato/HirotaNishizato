from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.ai_usage import AIUsage
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.usage import UsageSummary

router = APIRouter()


@router.get("/ai-summary", response_model=UsageSummary)
def ai_summary(
    period: str = "month",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UsageSummary:
    filters = [AIUsage.organization_id == user.organization_id]
    if period == "month":
        since = datetime.now(UTC) - timedelta(days=30)
        filters.append(AIUsage.created_at >= since)

    total_requests = db.query(func.count(AIUsage.id)).filter(*filters).scalar() or 0
    tin, tout, ttot = db.query(
        func.coalesce(func.sum(AIUsage.tokens_in), 0),
        func.coalesce(func.sum(AIUsage.tokens_out), 0),
        func.coalesce(func.sum(AIUsage.tokens_total), 0),
    ).filter(*filters).first()

    by_provider_rows = (
        db.query(AIUsage.provider, func.coalesce(func.sum(AIUsage.tokens_total), 0))
        .filter(*filters)
        .group_by(AIUsage.provider)
        .all()
    )
    by_provider = {p: int(v) for p, v in by_provider_rows}

    return UsageSummary(
        organization_id=user.organization_id,
        period=period,
        total_requests=total_requests,
        total_tokens_in=int(tin),
        total_tokens_out=int(tout),
        total_tokens=int(ttot),
        by_provider=by_provider,
    )


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    rows = (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == user.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(min(limit, 500))
        .all()
    )
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "action": r.action,
            "target_type": r.target_type,
            "target_id": r.target_id,
            "success": r.success,
            "ip_address": r.ip_address,
            "meta": r.meta,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
