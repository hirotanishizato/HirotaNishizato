"""下書き生成のオーケストレーター。
1. 問い合わせ取得
2. ナレッジ収集 (テンプレ/マニュアル/納期/商品/注文)
3. プロンプト構築
4. AI生成
5. Draftレコード保存 + AI利用量記録
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.integrations.ai import GenerationResult, get_ai_provider
from app.integrations.rms import get_rms_provider
from app.models.ai_usage import AIUsage
from app.models.draft import Draft, DraftStatus
from app.models.inquiry import Inquiry, InquiryStatus
from app.services.knowledge import build_knowledge_bundle
from app.services.prompt_builder import build_system_prompt, build_user_prompt


def _extract_token_usage(result: GenerationResult) -> tuple[int, int, int]:
    """各プロバイダのレスポンス形状からトークン数を抜き出す。
    取れない場合は (0, 0, 0) を返す。
    """
    raw: dict[str, Any] = result.raw or {}
    usage = raw.get("usage") or {}
    if not usage:
        return 0, 0, 0
    # OpenAI: prompt_tokens / completion_tokens / total_tokens
    p = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
    c = usage.get("completion_tokens") or usage.get("output_tokens") or 0
    t = usage.get("total_tokens") or (p + c)
    # Gemini: prompt_token_count / candidates_token_count / total_token_count
    if not (p or c or t):
        p = usage.get("prompt_token_count") or 0
        c = usage.get("candidates_token_count") or 0
        t = usage.get("total_token_count") or (p + c)
    return int(p or 0), int(c or 0), int(t or 0)


async def generate_draft_for_inquiry(db: Session, inquiry: Inquiry) -> Draft:
    shop = inquiry.shop
    rms = get_rms_provider(shop)
    ai = get_ai_provider()

    kb = await build_knowledge_bundle(db, inquiry, rms)
    system_prompt = build_system_prompt(shop)
    user_prompt = build_user_prompt(inquiry, kb)

    result = await ai.generate(system_prompt=system_prompt, user_prompt=user_prompt)

    sources = {
        "template_ids": [t.id for t in kb.templates],
        "manual_ids": [m.id for m in kb.manuals],
        "delivery_rule_ids": [r.id for r in kb.delivery_rules],
        "product_external_id": kb.product.external_id if kb.product else None,
        "order_external_ids": [o.external_id for o in kb.orders],
    }

    draft = Draft(
        inquiry_id=inquiry.id,
        body=result.text,
        status=DraftStatus.PENDING_REVIEW,
        ai_provider=result.provider,
        ai_model=result.model,
        prompt_snapshot={"system": system_prompt, "user": user_prompt},
        sources=sources,
    )
    db.add(draft)

    if inquiry.status == InquiryStatus.NEW:
        inquiry.status = InquiryStatus.DRAFTED

    db.flush()  # draft.id を得る

    # AI利用量を記録
    tokens_in, tokens_out, tokens_total = _extract_token_usage(result)
    db.add(
        AIUsage(
            organization_id=shop.organization_id,
            shop_id=shop.id,
            draft_id=draft.id,
            provider=result.provider,
            model=result.model,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            tokens_total=tokens_total,
        )
    )

    db.commit()
    db.refresh(draft)
    return draft
