from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class GenerationResult:
    text: str
    model: str
    provider: str
    raw: dict | None = None


class AIProvider(ABC):
    name: str = "abstract"

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.4,
    ) -> GenerationResult: ...
