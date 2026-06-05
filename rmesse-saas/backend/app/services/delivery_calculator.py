"""納期ルールから「いつ発送・いつ到着」の文言を組み立てるユーティリティ。

ここでは LLM に丸投げせず、ルールを構造化文字列化して LLM のコンテキストに渡す。
（推論ミスを抑え、トレース可能にするため）
"""
from __future__ import annotations

from datetime import UTC, date, datetime

from app.models.delivery_rule import DeliveryRule


def summarize_delivery_rule(rule: DeliveryRule) -> str:
    parts = [f"【納期ルール: {rule.name}】"]
    if rule.cutoff_time:
        parts.append(f"カットオフ: {rule.cutoff_time}")
    if rule.business_days:
        parts.append(f"営業日: {', '.join(rule.business_days)}")
    parts.append(f"発送: {rule.ship_within_business_days}営業日以内")
    if rule.arrival_by_region:
        regions = ", ".join(f"{k}={v}" for k, v in rule.arrival_by_region.items())
        parts.append(f"到着目安: {regions}")
    if rule.closed_dates:
        parts.append(f"休業日: {', '.join(rule.closed_dates)}")
    if rule.notes:
        parts.append(f"備考: {rule.notes}")
    return " / ".join(parts)


def select_applicable_rules(
    rules: list[DeliveryRule], product_external_ids: list[str] | None = None
) -> list[DeliveryRule]:
    """商品IDに紐づくルール + ショップ全体ルールを優先度順で返す。"""
    matched: list[DeliveryRule] = []
    pids = set(product_external_ids or [])
    for r in rules:
        if not r.is_active:
            continue
        if not r.applies_to_product_external_ids:
            matched.append(r)
            continue
        if pids and pids.intersection(r.applies_to_product_external_ids):
            matched.append(r)
    matched.sort(key=lambda r: (-r.priority, r.id))
    return matched


def reference_today() -> date:
    return datetime.now(UTC).astimezone().date()
