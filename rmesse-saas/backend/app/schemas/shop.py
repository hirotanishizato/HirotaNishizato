from datetime import datetime

from app.schemas.common import ORMModel


class ShopBase(ORMModel):
    name: str
    platform: str = "rakuten"
    shop_code: str | None = None
    ai_persona: str | None = None
    ai_signature: str | None = None
    is_active: bool = True
    auto_sync_enabled: bool = True


class ShopCreate(ShopBase):
    organization_id: int
    rms_service_secret: str | None = None
    rms_license_key: str | None = None


class ShopUpdate(ORMModel):
    name: str | None = None
    shop_code: str | None = None
    ai_persona: str | None = None
    ai_signature: str | None = None
    rms_service_secret: str | None = None
    rms_license_key: str | None = None
    is_active: bool | None = None
    auto_sync_enabled: bool | None = None


class ShopOut(ShopBase):
    id: int
    organization_id: int
    has_rms_credentials: bool = False
    last_synced_at: datetime | None = None
    last_sync_count: int | None = None
    last_sync_error: str | None = None
