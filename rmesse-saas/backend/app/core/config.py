from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    database_url: str = "sqlite:///./dev.db"

    jwt_secret: str = "change-me"  # noqa: S105 - dev default, override via env in production
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # 秘匿情報（RMS資格情報等）の暗号化キー (Fernet)。未設定時は jwt_secret から派生。
    secret_encryption_key: str = ""

    ai_provider: Literal["openai", "gemini"] = "openai"
    ai_model: str = "gpt-4o-mini"
    openai_api_key: str = ""
    gemini_api_key: str = ""

    rms_api_base: str = "https://api.rms.rakuten.co.jp"
    rms_mock_mode: bool = True

    # 問い合わせの自動同期（バックグラウンド）
    scheduler_enabled: bool = True
    inquiry_sync_interval_seconds: int = 300  # 5分

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
