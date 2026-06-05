"""ナレッジバンドルと問い合わせから、LLM用のシステム/ユーザープロンプトを組み立てる。"""
from __future__ import annotations

from app.models.inquiry import Inquiry
from app.models.shop import Shop
from app.services.knowledge import KnowledgeBundle

DEFAULT_PERSONA = (
    "あなたは日本の楽天市場の店舗のカスタマーサポート担当です。"
    "敬語で丁寧に、簡潔・明瞭に回答してください。"
    "事実が不明な箇所は推測せず『確認のうえ改めてご連絡』としてください。"
)


def build_system_prompt(shop: Shop) -> str:
    persona = (shop.ai_persona or "").strip() or DEFAULT_PERSONA
    signature = (shop.ai_signature or "").strip()
    sig_block = f"\n\n返信末尾には以下の署名を必ず付けてください:\n{signature}" if signature else ""
    return (
        f"{persona}\n\n"
        "あなたの仕事は、楽天R-Messeで受け付けた顧客からの問い合わせに対する『返信文の下書き』を作ることです。\n"
        "以下のルールを守ってください:\n"
        "1. 与えられた『参考情報』(テンプレート/マニュアル/納期ルール/商品情報/注文情報) を最大限活用する。\n"
        "2. テンプレートに合致する内容はテンプレートの文言を踏襲する。\n"
        "3. 納期ルールに該当する場合、適用ルールに従って具体的な発送日/到着目安を案内する。"
        " 不確実なときは断定せず、確認したうえで再度案内する旨を書く。\n"
        "4. 個人情報や注文内容を本人特定なしに公開しない。\n"
        "5. 返信は日本語、メール形式（冒頭の挨拶＋本文＋締め）。Markdown記号は使わない。\n"
        "6. 出力は返信本文のみ。前置きや説明文を加えない。"
        f"{sig_block}"
    )


def build_user_prompt(inquiry: Inquiry, kb: KnowledgeBundle) -> str:
    lines: list[str] = []
    lines.append("=== 問い合わせ ===")
    if inquiry.subject:
        lines.append(f"件名: {inquiry.subject}")
    if inquiry.customer_name:
        lines.append(f"顧客名: {inquiry.customer_name}")
    lines.append(f"本文:\n{inquiry.body}")

    if inquiry.product_external_id:
        lines.append(f"問い合わせ対象の商品ID: {inquiry.product_external_id}")
    if inquiry.order_external_id:
        lines.append(f"関連注文ID: {inquiry.order_external_id}")

    # --- 参考情報: テンプレート ---
    if kb.templates:
        lines.append("\n=== 参考: 登録テンプレート ===")
        for t in kb.templates[:10]:
            cat = f"[{t.category}]" if t.category else ""
            kws = f" (キーワード: {', '.join(t.match_keywords)})" if t.match_keywords else ""
            lines.append(f"- {cat}{t.title}{kws}\n  本文: {t.body}")

    # --- 商品情報 ---
    if kb.product:
        p = kb.product
        lines.append("\n=== 参考: 商品情報 ===")
        if p.name:
            lines.append(f"商品名: {p.name}")
        if p.price is not None:
            lines.append(f"価格: {p.price}円")
        if p.url:
            lines.append(f"URL: {p.url}")
        if p.description:
            lines.append(f"説明: {p.description}")
        if p.attributes:
            attrs = ", ".join(f"{k}={v}" for k, v in p.attributes.items())
            lines.append(f"属性: {attrs}")

    # --- マニュアル (商品ページに無い情報の補完) ---
    if kb.manuals:
        lines.append("\n=== 参考: マニュアル（商品ページに無い情報の補完用）===")
        for m in kb.manuals[:5]:
            lines.append(f"- {m.title}\n{m.content[:1500]}")

    # --- 納期ルール ---
    if kb.delivery_rules:
        lines.append("\n=== 参考: 納期ルール ===")
        for n in kb.notes:
            lines.append(f"- {n}")

    # --- 注文情報 ---
    if kb.orders:
        lines.append("\n=== 参考: 顧客の注文情報 ===")
        for o in kb.orders[:3]:
            lines.append(f"注文番号: {o.external_id}")
            if o.ordered_at:
                lines.append(f"  注文日時: {o.ordered_at.isoformat()}")
            if o.status:
                lines.append(f"  ステータス: {o.status}")
            if o.delivery_note:
                lines.append(f"  納期メモ(注文全体): {o.delivery_note}")
            if o.shipping_region:
                lines.append(f"  配送地域: {o.shipping_region}")
            for it in o.items:
                lines.append(
                    f"  商品: {it.name} x{it.quantity}"
                    + (f" / 納期: {it.delivery_note}" if it.delivery_note else "")
                )

    lines.append(
        "\n以上を踏まえ、返信本文のみを日本語で出力してください。"
        " テンプレートに完全合致する場合はそれを踏襲、合致しない場合は参考情報を統合して自然な返信にしてください。"
    )
    return "\n".join(lines)
