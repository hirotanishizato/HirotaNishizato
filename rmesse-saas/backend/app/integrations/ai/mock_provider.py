from __future__ import annotations

from app.integrations.ai.base import AIProvider, GenerationResult


class MockAIProvider(AIProvider):
    """APIキーが無いときに動かす決定論的モック。下書きフォーマットを保ったテキストを返す。"""

    name = "mock"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.4,
    ) -> GenerationResult:
        text = (
            "お問い合わせいただきありがとうございます。\n\n"
            "（※ これはモック生成です。実環境では OpenAI / Gemini により生成されます）\n\n"
            "ご質問の件、確認のうえご案内いたします。\n"
            "今しばらくお待ちくださいますようお願い申し上げます。\n\n"
            "--\nカスタマーサポート"
        )
        return GenerationResult(
            text=text,
            model=model or "mock-model",
            provider=self.name,
            raw={"system_prompt_chars": len(system_prompt), "user_prompt_chars": len(user_prompt)},
        )
