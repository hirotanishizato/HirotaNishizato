"""エンドツーエンドのスモークテスト。
1. 問い合わせ同期
2. AI下書き生成
3. 返信送信 (RMSは mock)
"""
import asyncio

from app.db.session import SessionLocal
from app.models import Inquiry, Shop
from app.services.draft_composer import generate_draft_for_inquiry
from app.services.inquiry_sync import sync_inquiries_for_shop


async def main() -> None:
    db = SessionLocal()
    try:
        shop = db.query(Shop).first()
        assert shop, "Run seed_demo.py first"
        print(f"Shop: {shop.name} (id={shop.id})")

        created = await sync_inquiries_for_shop(db, shop)
        print(f"Synced {len(created)} new inquiries")

        for inq in db.query(Inquiry).filter(Inquiry.shop_id == shop.id).all():
            print(f"\n--- Inquiry #{inq.id}: {inq.subject} ---")
            print(f"Body: {inq.body[:80]}...")
            draft = await generate_draft_for_inquiry(db, inq)
            print(f"\n[Draft #{draft.id} provider={draft.ai_provider} model={draft.ai_model}]")
            print(draft.body)
            print(f"\nSources: {draft.sources}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
