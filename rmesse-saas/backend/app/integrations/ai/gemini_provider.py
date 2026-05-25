"""Gemini (Google Generative AI) プロバイダ。
APIキーは `GEMINI_API_KEY`。モデルは `AI_MODEL` (例: gemini-1.5-flash, gemini-1.5-pro)。
"""
from __future__ import annotations

import asyncio

import google.generativeai as genai

from app.core.config import get_settings
from app.integrations.ai.base import AIProvider, GenerationResult


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str | None = None) -> None:
        settings = get_settings()
        key = api_key or settings.gemini_api_key
        if not key:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=key)
        # Geminiの典型的デフォルト
        default = settings.ai_model if settings.ai_model.startswith("gemini") else "gemini-1.5-flash"
        self._default_model = default

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.4,
    ) -> GenerationResult:
        use_model = model or self._default_model
        model_obj = genai.GenerativeModel(
            model_name=use_model,
            system_instruction=system_prompt,
            generation_config={"temperature": temperature},
        )
        # SDKは同期APIなのでスレッドプールに逃がす
        resp = await asyncio.to_thread(model_obj.generate_content, user_prompt)
        text = (getattr(resp, "text", None) or "").strip()
        usage = getattr(resp, "usage_metadata", None)
        return GenerationResult(
            text=text,
            model=use_model,
            provider=self.name,
            raw={"usage": getattr(usage, "__dict__", None) if usage else None},
        )
