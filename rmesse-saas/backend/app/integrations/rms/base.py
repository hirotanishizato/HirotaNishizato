"""RMS統合の抽象基底。
楽天 (R-Messe) 以外のモールにも対応できるよう、ここでDTOとインタフェースを規定する。
具体実装は `rakuten.py`, `mock.py` 等。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class InquiryDTO:
    external_id: str
    body: str
    subject: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    product_external_id: str | None = None
    order_external_id: str | None = None
    received_at: datetime | None = None
    raw: dict = field(default_factory=dict)


@dataclass
class ProductDTO:
    external_id: str
    name: str | None = None
    url: str | None = None
    price: int | None = None
    description: str | None = None
    attributes: dict = field(default_factory=dict)
    raw_html_excerpt: str | None = None


@dataclass
class OrderItemDTO:
    product_external_id: str | None
    name: str | None
    quantity: int = 1
    price: int | None = None
    delivery_note: str | None = None


@dataclass
class OrderDTO:
    external_id: str
    customer_name: str | None = None
    customer_email: str | None = None
    ordered_at: datetime | None = None
    shipped_at: datetime | None = None
    status: str | None = None
    total_amount: int | None = None
    delivery_note: str | None = None
    shipping_region: str | None = None
    shipping_address: dict | None = None
    items: list[OrderItemDTO] = field(default_factory=list)


class RMSProvider(ABC):
    """1ショップ分のRMS APIアクセス。インスタンス化時にショップ認証情報を受ける。"""

    @abstractmethod
    async def list_inquiries(self, since: datetime | None = None) -> list[InquiryDTO]: ...

    @abstractmethod
    async def get_inquiry(self, external_id: str) -> InquiryDTO | None: ...

    @abstractmethod
    async def send_reply(self, inquiry_external_id: str, body: str) -> bool: ...

    @abstractmethod
    async def get_product(self, external_id: str) -> ProductDTO | None: ...

    @abstractmethod
    async def get_order(self, external_id: str) -> OrderDTO | None: ...

    @abstractmethod
    async def find_orders_by_customer(
        self, email: str | None = None, name: str | None = None
    ) -> list[OrderDTO]: ...
