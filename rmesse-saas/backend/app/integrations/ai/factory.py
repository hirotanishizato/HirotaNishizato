from __future__ import annotations

from app.core.config import get_settings
from app.integrations.ai.base import AIProvider
from app.integrations.ai.mock_provider import MockAIProvider
from app.integrations.ai.openai_provider import OpenAIProvider


def get_ai_provider() -> AIProvider:
    settings = get_settings()
    if settings.ai_provider == "openai":
        if not settings.openai_api_key:
            return MockAIProvider()
        return OpenAIProvider()
    if settings.ai_provider == "gemini":
        # 将来実装: GeminiProvider
        if not settings.gemini_api_key:
            return MockAIProvider()
        raise NotImplementedError("Gemini provider not implemented yet; please use openai or set GEMINI_API_KEY when implemented")
    return MockAIProvider()
