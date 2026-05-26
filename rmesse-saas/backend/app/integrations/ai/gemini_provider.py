"""Gemini (Google Generative AI) プロバイダ。
APIキーは `GEMINI_API_KEY`。モデルは `AI_MODEL` (例: gemini-2.5-flash, gemini-1.5-pro)。

実装ノート:
- 公式SDKは既定でgRPC通信を行うが、企業プロキシ環境(自己署名CA介在)では
  TLS検証に失敗するため `transport="rest"` を明示し REST 経路を使用する。
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
        # REST 経路を強制（gRPCはプロキシ環境でTLS検証に失敗することがある）
        genai.configure(api_key=key, transport="rest")
        default = settings.ai_model if settings.ai_model.startswith("gemini") else "gemini-2.5-flash"
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
        resp = await asyncio.to_thread(model_obj.generate_content, user_prompt)
        text = (getattr(resp, "text", None) or "").strip()
        usage = getattr(resp, "usage_metadata", None)
        usage_dict: dict | None = None
        if usage is not None:
            usage_dict = {
                "prompt_token_count": getattr(usage, "prompt_token_count", 0),
                "candidates_token_count": getattr(usage, "candidates_token_count", 0),
                "total_token_count": getattr(usage, "total_token_count", 0),
            }
        return GenerationResult(
            text=text,
            model=use_model,
            provider=self.name,
            raw={"usage": usage_dict},
        )
