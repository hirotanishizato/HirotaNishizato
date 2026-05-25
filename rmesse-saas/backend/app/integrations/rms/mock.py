"""開発用モック実装。RMS APIキーが無くてもアプリの挙動を確認できる。"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.integrations.rms.base import (
    InquiryDTO,
    OrderDTO,
    OrderItemDTO,
    ProductDTO,
    RMSProvider,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MockRMSProvider(RMSProvider):
    def __init__(self, shop_code: str | None = None) -> None:
        self.shop_code = shop_code or "mock-shop"

    async def list_inquiries(self, since: datetime | None = None) -> list[InquiryDTO]:
        return [
            InquiryDTO(
                external_id="MOCK-INQ-0001",
                subject="商品の納期について",
                body=(
                    "先日注文した商品ですが、いつ頃発送されますでしょうか？"
                    "急いでいるため、できれば明日中に欲しいです。"
                ),
                customer_name="山田 太郎",
                customer_email="taro@example.com",
                product_external_id="MOCK-PROD-A",
                order_external_id="MOCK-ORD-1001",
                received_at=_now() - timedelta(hours=2),
            ),
            InquiryDTO(
                external_id="MOCK-INQ-0002",
                subject="使い方が分からない",
                body="購入したソフトのインストール方法が分かりません。教えてください。",
                customer_name="佐藤 花子",
                customer_email="hanako@example.com",
                product_external_id="MOCK-PROD-B",
                received_at=_now() - timedelta(hours=5),
            ),
        ]

    async def get_inquiry(self, external_id: str) -> InquiryDTO | None:
        for inq in await self.list_inquiries():
            if inq.external_id == external_id:
                return inq
        return None

    async def send_reply(self, inquiry_external_id: str, body: str) -> bool:
        # モックなので送信完了扱い
        return True

    async def get_product(self, external_id: str) -> ProductDTO | None:
        catalog = {
            "MOCK-PROD-A": ProductDTO(
                external_id="MOCK-PROD-A",
                name="サンプル商品A（家電）",
                url="https://item.rakuten.co.jp/mock-shop/prod-a/",
                price=12800,
                description="高機能サンプル家電。在庫あり、通常翌営業日発送。",
                attributes={"在庫": "あり", "保証": "1年", "重量": "1.2kg"},
            ),
            "MOCK-PROD-B": ProductDTO(
                external_id="MOCK-PROD-B",
                name="サンプルソフトB",
                url="https://item.rakuten.co.jp/mock-shop/prod-b/",
                price=4980,
                description="PC用ユーティリティソフト。ダウンロード版あり。",
                attributes={"対応OS": "Windows 10/11, macOS 12+"},
            ),
        }
        return catalog.get(external_id)

    async def get_order(self, external_id: str) -> OrderDTO | None:
        if external_id == "MOCK-ORD-1001":
            return OrderDTO(
                external_id="MOCK-ORD-1001",
                customer_name="山田 太郎",
                customer_email="taro@example.com",
                ordered_at=_now() - timedelta(days=1),
                status="決済確認済",
                total_amount=12800,
                delivery_note="平日14時までのご注文で翌営業日発送",
                shipping_region="関東",
                shipping_address={"prefecture": "東京都", "city": "新宿区"},
                items=[
                    OrderItemDTO(
                        product_external_id="MOCK-PROD-A",
                        name="サンプル商品A（家電）",
                        quantity=1,
                        price=12800,
                        delivery_note="通常翌営業日発送",
                    )
                ],
            )
        return None

    async def find_orders_by_customer(
        self, email: str | None = None, name: str | None = None
    ) -> list[OrderDTO]:
        ord_ = await self.get_order("MOCK-ORD-1001")
        if not ord_:
            return []
        if email and ord_.customer_email == email:
            return [ord_]
        if name and ord_.customer_name == name:
            return [ord_]
        return []
