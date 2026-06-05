from __future__ import annotations

from app.core.config import get_settings
from app.core.crypto import decrypt
from app.integrations.rms.base import RMSProvider
from app.integrations.rms.mock import MockRMSProvider
from app.integrations.rms.rakuten import RakutenRMSProvider
from app.models.shop import Shop


def get_rms_provider(shop: Shop) -> RMSProvider:
    """Shopから適切なプロバイダを返す。
    - 設定が `RMS_MOCK_MODE=true` または Shop に資格情報が無ければモック。
    - shop.platform が "rakuten" 以外なら将来の別プロバイダを返す（未実装）。
    """
    settings = get_settings()

    secret = decrypt(shop.rms_service_secret)
    license_key = decrypt(shop.rms_license_key)

    if settings.rms_mock_mode or not secret or not license_key:
        return MockRMSProvider(shop_code=shop.shop_code)

    if shop.platform == "rakuten":
        return RakutenRMSProvider(
            service_secret=secret,
            license_key=license_key,
            shop_code=shop.shop_code,
            api_base=settings.rms_api_base,
        )

    raise NotImplementedError(f"Platform '{shop.platform}' not supported yet")
