from __future__ import annotations

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.integrations.ai.base import AIProvider, GenerationResult


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, api_key: str | None = None) -> None:
        settings = get_settings()
        key = api_key or settings.openai_api_key
        if not key:
            raise ValueError("OPENAI_API_KEY is not set")
        self._client = AsyncOpenAI(api_key=key)
        self._default_model = settings.ai_model or "gpt-4o-mini"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.4,
    ) -> GenerationResult:
        use_model = model or self._default_model
        resp = await self._client.chat.completions.create(
            model=use_model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        text = resp.choices[0].message.content or ""
        return GenerationResult(
            text=text.strip(),
            model=use_model,
            provider=self.name,
            raw={"id": resp.id, "usage": resp.usage.model_dump() if resp.usage else None},
        )
