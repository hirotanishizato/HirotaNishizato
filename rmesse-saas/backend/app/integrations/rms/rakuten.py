"""楽天RMS実装。

公式仕様:
- 認証は `serviceSecret` と `licenseKey` を Base64 連結して
  `Authorization: ESA <base64(serviceSecret:licenseKey)>` で送る。
- R-Messe (問い合わせ) API、楽天商品API (RMS WEB SERVICE), 受注API (rms.order.searchOrder) を使用。

注: ここでは構造（リクエスト整形、ヘッダ、HTML/JSONパース）と、商品ページHTMLからの
情報抽出ヘルパまでを実装する。実稼働には正規エンドポイントURL/フォーマットの確認、
APIキーの暗号化保管、レート制御などの上乗せが必要。
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.core.config import get_settings
from app.integrations.rms.base import (
    InquiryDTO,
    OrderDTO,
    OrderItemDTO,
    ProductDTO,
    RMSProvider,
)

logger = logging.getLogger(__name__)


def _build_auth_header(service_secret: str, license_key: str) -> str:
    token = base64.b64encode(f"{service_secret}:{license_key}".encode()).decode("ascii")
    return f"ESA {token}"


class RakutenRMSProvider(RMSProvider):
    def __init__(
        self,
        service_secret: str,
        license_key: str,
        shop_code: str | None = None,
        api_base: str | None = None,
    ) -> None:
        if not service_secret or not license_key:
            raise ValueError("Rakuten RMS credentials are required")
        self.service_secret = service_secret
        self.license_key = license_key
        self.shop_code = shop_code
        self.api_base = api_base or get_settings().rms_api_base
        self._auth = _build_auth_header(service_secret, license_key)

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        h = {
            "Authorization": self._auth,
            "Accept": "application/json",
            "User-Agent": "rmesse-saas/0.1",
        }
        if extra:
            h.update(extra)
        return h

    async def _get(self, path: str, params: dict | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(f"{self.api_base}{path}", headers=self._headers(), params=params)
            r.raise_for_status()
            return r.json()

    async def _post(self, path: str, json_body: dict | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"{self.api_base}{path}",
                headers=self._headers({"Content-Type": "application/json"}),
                json=json_body or {},
            )
            r.raise_for_status()
            return r.json()

    # ---------- 問い合わせ (R-Messe) ----------

    async def list_inquiries(self, since: datetime | None = None) -> list[InquiryDTO]:
        # NOTE: 実エンドポイントは要確認。下記は形式の例。
        params: dict[str, Any] = {}
        if since:
            params["startDate"] = since.isoformat()
        try:
            data = await self._get("/es/2.0/inquiry/search", params=params)
        except httpx.HTTPError as e:
            logger.exception("RMS inquiry list failed: %s", e)
            return []

        items = data.get("inquiries") or data.get("items") or []
        return [self._inquiry_from_raw(it) for it in items]

    async def get_inquiry(self, external_id: str) -> InquiryDTO | None:
        try:
            data = await self._get(f"/es/2.0/inquiry/{external_id}")
        except httpx.HTTPError:
            return None
        return self._inquiry_from_raw(data)

    async def send_reply(self, inquiry_external_id: str, body: str) -> bool:
        try:
            await self._post(
                f"/es/2.0/inquiry/{inquiry_external_id}/reply",
                json_body={"body": body},
            )
            return True
        except httpx.HTTPError as e:
            logger.exception("RMS reply failed: %s", e)
            return False

    @staticmethod
    def _inquiry_from_raw(raw: dict) -> InquiryDTO:
        return InquiryDTO(
            external_id=str(raw.get("id") or raw.get("inquiryId") or ""),
            subject=raw.get("subject") or raw.get("title"),
            body=raw.get("body") or raw.get("message") or "",
            customer_name=raw.get("customerName") or raw.get("userName"),
            customer_email=raw.get("customerEmail") or raw.get("email"),
            product_external_id=raw.get("itemId") or raw.get("productId"),
            order_external_id=raw.get("orderNumber") or raw.get("orderId"),
            received_at=_parse_dt(raw.get("receivedAt") or raw.get("createdAt")),
            raw=raw,
        )

    # ---------- 商品 ----------

    async def get_product(self, external_id: str) -> ProductDTO | None:
        # まずRMS API、ダメなら商品ページHTMLにフォールバック
        try:
            data = await self._get(f"/es/2.0/items/{external_id}")
            return ProductDTO(
                external_id=external_id,
                name=data.get("itemName"),
                url=data.get("itemUrl"),
                price=data.get("itemPrice"),
                description=data.get("itemDescription"),
                attributes=data.get("attributes") or {},
            )
        except httpx.HTTPError:
            pass

        # フォールバック: 商品ページHTMLをスクレイプ
        if self.shop_code:
            url = f"https://item.rakuten.co.jp/{self.shop_code}/{external_id}/"
            return await self.fetch_product_from_page(external_id, url)
        return None

    async def fetch_product_from_page(self, external_id: str, url: str) -> ProductDTO | None:
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                r = await client.get(url, headers={"User-Agent": "rmesse-saas/0.1"})
                r.raise_for_status()
                html = r.text
        except httpx.HTTPError:
            return None

        soup = BeautifulSoup(html, "lxml")
        title = soup.find("meta", property="og:title")
        desc = soup.find("meta", attrs={"name": "description"})
        # 概要セクション抽出 (汎用ヒューリスティック)
        excerpt = soup.body.get_text(" ", strip=True)[:4000] if soup.body else None
        return ProductDTO(
            external_id=external_id,
            name=title["content"] if title and title.get("content") else None,
            url=url,
            description=desc["content"] if desc and desc.get("content") else None,
            raw_html_excerpt=excerpt,
        )

    # ---------- 注文 ----------

    async def get_order(self, external_id: str) -> OrderDTO | None:
        try:
            data = await self._post(
                "/es/2.0/order/searchOrder",
                json_body={"orderNumberList": [external_id]},
            )
        except httpx.HTTPError:
            return None
        orders = data.get("OrderModelList") or data.get("orders") or []
        if not orders:
            return None
        return self._order_from_raw(orders[0])

    async def find_orders_by_customer(
        self, email: str | None = None, name: str | None = None
    ) -> list[OrderDTO]:
        if not email and not name:
            return []
        body: dict[str, Any] = {}
        if email:
            body["emailAddress"] = email
        if name:
            body["ordererName"] = name
        try:
            data = await self._post("/es/2.0/order/searchOrder", json_body=body)
        except httpx.HTTPError:
            return []
        return [self._order_from_raw(o) for o in (data.get("OrderModelList") or [])]

    @staticmethod
    def _order_from_raw(raw: dict) -> OrderDTO:
        items_raw = raw.get("ItemModelList") or raw.get("items") or []
        items = [
            OrderItemDTO(
                product_external_id=it.get("itemNumber") or it.get("manageNumber"),
                name=it.get("itemName"),
                quantity=int(it.get("units") or it.get("quantity") or 1),
                price=it.get("price"),
                delivery_note=it.get("deliveryName") or it.get("deliveryNote"),
            )
            for it in items_raw
        ]
        return OrderDTO(
            external_id=str(raw.get("orderNumber") or raw.get("orderId") or ""),
            customer_name=raw.get("ordererName"),
            customer_email=raw.get("emailAddress"),
            ordered_at=_parse_dt(raw.get("orderDatetime")),
            shipped_at=_parse_dt(raw.get("shippingDatetime")),
            status=raw.get("orderProgress") or raw.get("status"),
            total_amount=raw.get("totalPrice"),
            delivery_note=raw.get("remarks"),
            shipping_region=(raw.get("shippingModelList") or [{}])[0].get("prefecture"),
            shipping_address=raw.get("shippingModelList"),
            items=items,
        )


def _parse_dt(s: Any) -> datetime | None:
    if not s:
        return None
    if isinstance(s, datetime):
        return s
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None
