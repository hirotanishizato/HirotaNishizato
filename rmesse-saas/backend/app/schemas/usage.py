from app.schemas.common import ORMModel


class UsageSummary(ORMModel):
    """Organization単位のAI利用量サマリ。"""

    organization_id: int
    period: str  # "month" / "all"
    total_requests: int
    total_tokens_in: int
    total_tokens_out: int
    total_tokens: int
    by_provider: dict[str, int]  # provider -> total_tokens


class AuditLogOut(ORMModel):
    id: int
    organization_id: int | None
    user_id: int | None
    action: str
    target_type: str | None
    target_id: str | None
    success: bool
    ip_address: str | None
    user_agent: str | None
    meta: dict | None
    created_at: str
