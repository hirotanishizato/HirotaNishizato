from app.integrations.rms.base import OrderDTO, OrderItemDTO, ProductDTO
from app.models.delivery_rule import DeliveryRule
from app.models.inquiry import Inquiry
from app.models.manual import Manual
from app.models.shop import Shop
from app.models.template import Template
from app.services.knowledge import KnowledgeBundle
from app.services.prompt_builder import build_system_prompt, build_user_prompt


def _inq() -> Inquiry:
    return Inquiry(
        id=1,
        shop_id=1,
        external_id="EXT-1",
        subject="納期について",
        body="いつ届きますか？",
        customer_name="山田",
        customer_email="y@example.com",
        product_external_id="P1",
        order_external_id="O1",
    )


def test_system_prompt_uses_persona_and_signature():
    shop = Shop(name="S", ai_persona="親しみやすく", ai_signature="店舗A サポート")
    out = build_system_prompt(shop)
    assert "親しみやすく" in out
    assert "店舗A サポート" in out


def test_system_prompt_default_persona():
    shop = Shop(name="S")
    out = build_system_prompt(shop)
    assert "敬語" in out


def test_user_prompt_includes_all_knowledge():
    kb = KnowledgeBundle(
        templates=[Template(id=1, shop_id=1, title="配送", category="配送", body="平日14時まで当日発送", match_keywords=["発送"])],
        manuals=[Manual(id=1, shop_id=1, title="商品A説明", content="100V専用")],
        delivery_rules=[DeliveryRule(id=1, shop_id=1, name="標準", cutoff_time="14:00")],
        product=ProductDTO(external_id="P1", name="商品A", price=1000, description="家電"),
        orders=[OrderDTO(
            external_id="O1",
            customer_name="山田",
            status="決済済",
            delivery_note="翌営業日発送",
            items=[OrderItemDTO(product_external_id="P1", name="商品A", quantity=1)],
        )],
        notes=["平日14時カットオフ"],
    )
    out = build_user_prompt(_inq(), kb)
    assert "山田" in out
    assert "商品A" in out
    assert "配送" in out
    assert "100V専用" in out
    assert "O1" in out
    assert "平日14時カットオフ" in out
