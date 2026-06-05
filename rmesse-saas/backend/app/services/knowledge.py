"""下書き生成時に参照する各種ナレッジを集約・整形する。
テンプレート / マニュアル / 商品情報 / 納期ルール / 注文情報 を統一的に扱う。
"""
from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.integrations.rms.base import OrderDTO, ProductDTO, RMSProvider
from app.models.delivery_rule import DeliveryRule
from app.models.inquiry import Inquiry
from app.models.manual import Manual
from app.models.template import Template
from app.services.delivery_calculator import (
    select_applicable_rules,
    summarize_delivery_rule,
)


@dataclass
class KnowledgeBundle:
    """LLMに渡す文脈情報の集約。"""

    templates: list[Template] = field(default_factory=list)
    manuals: list[Manual] = field(default_factory=list)
    delivery_rules: list[DeliveryRule] = field(default_factory=list)
    product: ProductDTO | None = None
    orders: list[OrderDTO] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def has_any(self) -> bool:
        return bool(
            self.templates
            or self.manuals
            or self.delivery_rules
            or self.product
            or self.orders
        )


def load_shop_knowledge(db: Session, shop_id: int) -> tuple[list[Template], list[Manual], list[DeliveryRule]]:
    templates = (
        db.query(Template)
        .filter(Template.shop_id == shop_id, Template.is_active.is_(True))
        .order_by(Template.priority.desc(), Template.id)
        .all()
    )
    manuals = (
        db.query(Manual)
        .filter(Manual.shop_id == shop_id, Manual.is_active.is_(True))
        .order_by(Manual.id)
        .all()
    )
    rules = (
        db.query(DeliveryRule)
        .filter(DeliveryRule.shop_id == shop_id, DeliveryRule.is_active.is_(True))
        .order_by(DeliveryRule.priority.desc(), DeliveryRule.id)
        .all()
    )
    return templates, manuals, rules


def filter_manuals_for_product(
    manuals: list[Manual], product_external_id: str | None
) -> list[Manual]:
    out: list[Manual] = []
    for m in manuals:
        if not m.applies_to_product_external_ids:
            out.append(m)  # 全商品共通
        elif product_external_id and product_external_id in m.applies_to_product_external_ids:
            out.append(m)
    return out


async def build_knowledge_bundle(
    db: Session, inquiry: Inquiry, rms: RMSProvider
) -> KnowledgeBundle:
    templates, manuals, rules = load_shop_knowledge(db, inquiry.shop_id)

    # 1) 商品情報取得 (商品が紐づいていれば)
    product: ProductDTO | None = None
    if inquiry.product_external_id:
        product = await rms.get_product(inquiry.product_external_id)

    # 2) 注文情報取得: 注文IDがあれば直接、無くてもメール/名前で検索
    orders: list[OrderDTO] = []
    if inquiry.order_external_id:
        o = await rms.get_order(inquiry.order_external_id)
        if o:
            orders.append(o)
    else:
        if inquiry.customer_email or inquiry.customer_name:
            orders = await rms.find_orders_by_customer(
                email=inquiry.customer_email, name=inquiry.customer_name
            )

    # 3) 商品に該当するマニュアルだけ残す（全商品共通はそのまま）
    filtered_manuals = filter_manuals_for_product(manuals, inquiry.product_external_id)

    # 4) 商品に該当する納期ルール（注文の商品も加味）
    related_pids: list[str] = []
    if inquiry.product_external_id:
        related_pids.append(inquiry.product_external_id)
    for o in orders:
        for it in o.items:
            if it.product_external_id:
                related_pids.append(it.product_external_id)
    applicable_rules = select_applicable_rules(rules, related_pids or None)

    notes: list[str] = []
    if applicable_rules:
        notes.extend(summarize_delivery_rule(r) for r in applicable_rules)

    # 商品ページに情報が乏しい場合、マニュアル必須を明示
    if product and not (product.description or product.attributes):
        notes.append("商品ページに詳細情報が乏しいため、マニュアル情報を優先して参照すること。")

    return KnowledgeBundle(
        templates=templates,
        manuals=filtered_manuals,
        delivery_rules=applicable_rules,
        product=product,
        orders=orders,
        notes=notes,
    )
