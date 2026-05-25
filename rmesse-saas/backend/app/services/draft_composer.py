"""下書き生成のオーケストレーター。
1. 問い合わせ取得
2. ナレッジ収集 (テンプレ/マニュアル/納期/商品/注文)
3. プロンプト構築
4. AI生成
5. Draftレコード保存
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.integrations.ai import get_ai_provider
from app.integrations.rms import get_rms_provider
from app.models.draft import Draft, DraftStatus
from app.models.inquiry import Inquiry, InquiryStatus
from app.services.knowledge import build_knowledge_bundle
from app.services.prompt_builder import build_system_prompt, build_user_prompt


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

    db.commit()
    db.refresh(draft)
    return draft
