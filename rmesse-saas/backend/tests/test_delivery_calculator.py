from app.models.delivery_rule import DeliveryRule
from app.services.delivery_calculator import select_applicable_rules, summarize_delivery_rule


def test_summarize_includes_all_fields():
    r = DeliveryRule(
        name="標準",
        cutoff_time="14:00",
        business_days=["mon", "tue"],
        ship_within_business_days=1,
        arrival_by_region={"関東": "翌日"},
        closed_dates=["2026-01-01"],
        notes="年末年始休業",
    )
    s = summarize_delivery_rule(r)
    assert "標準" in s
    assert "14:00" in s
    assert "関東=翌日" in s
    assert "年末年始休業" in s


def test_select_applicable_rules_priority_and_filter():
    r1 = DeliveryRule(id=1, name="全体", is_active=True, priority=1)
    r2 = DeliveryRule(
        id=2, name="特定商品", is_active=True, priority=10,
        applies_to_product_external_ids=["P1"],
    )
    r3 = DeliveryRule(
        id=3, name="別商品", is_active=True, priority=10,
        applies_to_product_external_ids=["PX"],
    )
    r4 = DeliveryRule(id=4, name="無効", is_active=False, priority=99)

    out = select_applicable_rules([r1, r2, r3, r4], product_external_ids=["P1"])
    ids = [r.id for r in out]
    assert ids == [2, 1]  # 特定商品ヒット + 全体、優先度順
