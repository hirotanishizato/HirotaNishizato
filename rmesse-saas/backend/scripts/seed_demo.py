"""デモ用のサンプルデータを投入。RMS_MOCK_MODE=true での動作確認用。"""
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    DeliveryRule,
    Manual,
    Organization,
    Shop,
    Template,
    User,
    UserRole,
)


def run(db: Session) -> None:
    Base.metadata.create_all(bind=engine)

    if db.query(Organization).first():
        print("Demo data already exists. Skipping.")
        return

    org = Organization(name="Demo Company", plan="free")
    db.add(org)
    db.flush()

    user = User(
        organization_id=org.id,
        email="demo@example.com",
        password_hash=hash_password("demo1234"),
        name="Demo Owner",
        role=UserRole.OWNER,
    )
    db.add(user)

    shop = Shop(
        organization_id=org.id,
        name="Demo楽天店舗",
        platform="rakuten",
        shop_code="mock-shop",
        ai_persona="あなたは家電販売店『Demo楽天店舗』のカスタマーサポートです。明るく丁寧な口調で。",
        ai_signature="――――――――――\nDemo楽天店舗 カスタマーサポート\n営業時間: 平日10:00-18:00",
    )
    db.add(shop)
    db.flush()

    db.add_all([
        Template(
            shop_id=shop.id,
            title="発送日に関する標準回答",
            category="配送",
            body="ご注文の発送についてご案内いたします。平日14時までのご注文は当日発送、それ以降は翌営業日発送となります。",
            match_keywords=["発送", "いつ送", "配送"],
            priority=10,
        ),
        Template(
            shop_id=shop.id,
            title="返品・交換ポリシー",
            category="返品",
            body="商品到着後7日以内であれば未開封品に限り返品交換を承ります。お手数ですが当店まで一度ご連絡をお願いいたします。",
            match_keywords=["返品", "交換"],
            priority=5,
        ),
    ])

    db.add(Manual(
        shop_id=shop.id,
        title="サンプル商品A 取扱マニュアル",
        content=(
            "サンプル商品Aは家庭用100V専用です。海外電圧では使用できません。"
            "初回起動時はバッテリーを満充電してからご使用ください。"
            "故障時は1年間のメーカー保証が適用されます。"
        ),
        applies_to_product_external_ids=["MOCK-PROD-A"],
    ))

    db.add(Manual(
        shop_id=shop.id,
        title="サンプルソフトB インストール手順",
        content=(
            "サンプルソフトBはWindows 10/11およびmacOS 12以上に対応。"
            "ダウンロード版はご購入後マイページからインストーラを取得できます。"
            "ライセンスキーは購入完了メール記載の英数字16桁です。"
        ),
        applies_to_product_external_ids=["MOCK-PROD-B"],
    ))

    db.add(DeliveryRule(
        shop_id=shop.id,
        name="標準納期ルール",
        cutoff_time="14:00",
        business_days=["mon", "tue", "wed", "thu", "fri"],
        ship_within_business_days=0,  # カットオフ前は当日発送
        arrival_by_region={"関東": "翌日", "関西": "翌々日", "九州": "2日後", "北海道": "2-3日"},
        notes="平日14時までは当日発送、それ以降は翌営業日発送。土日祝休業。",
        priority=10,
    ))

    db.commit()
    print("Demo data seeded.")
    print(f"  Organization: {org.id}")
    print(f"  Shop: {shop.id} (platform=rakuten, mock mode)")
    print(f"  User: demo@example.com / demo1234")


def main() -> None:
    db = SessionLocal()
    try:
        run(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
