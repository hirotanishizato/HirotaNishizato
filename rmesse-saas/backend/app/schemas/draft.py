from datetime import datetime

from app.models.draft import DraftStatus
from app.schemas.common import ORMModel


class DraftOut(ORMModel):
    id: int
    inquiry_id: int
    body: str
    status: DraftStatus
    ai_provider: str | None
    ai_model: str | None
    sources: dict | None
    created_at: datetime


class DraftUpdate(ORMModel):
    body: str | None = None
    status: DraftStatus | None = None
