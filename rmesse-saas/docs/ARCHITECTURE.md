# アーキテクチャ

## 設計原則

1. **マルチテナント前提**: 1テナント = 1 Organization、Organizationが複数Shopを持つ。最初から複数事業者に開放可能。
2. **プロバイダ抽象化**: RMSもAIも `Provider` インタフェースで差し替え可能。Yahooショッピングや別LLMを後で足せる。
3. **ナレッジ統合**: テンプレート/マニュアル/納期ルール/商品情報/注文情報を `KnowledgeBundle` に集約してLLMに渡す。
4. **トレース可能性**: 生成された下書きは `prompt_snapshot` と `sources` を保持。後から「なぜこの返信になったか」を遡れる。
5. **人間チェック必須**: AIは下書きまで。承認・編集・送信ボタンは人間が押す。

## レイヤー

```
┌─────────────────────────────────────────────────────┐
│ API (FastAPI)             app/api/v1/*              │
├─────────────────────────────────────────────────────┤
│ Services (ビジネスロジック)  app/services/*           │
│   - draft_composer  : 下書き生成オーケストレーター     │
│   - knowledge       : ナレッジ統合                    │
│   - prompt_builder  : プロンプト構築                  │
│   - inquiry_sync    : RMSポーリング                  │
│   - delivery_calc   : 納期ルール整形                  │
├─────────────────────────────────────────────────────┤
│ Integrations (外部接続)    app/integrations/*        │
│   - rms/  (Rakuten / Mock)                          │
│   - ai/   (OpenAI / Mock / [Gemini予定])             │
├─────────────────────────────────────────────────────┤
│ Models (永続化)            app/models/*              │
│   - Organization / User / Shop                      │
│   - Inquiry / Draft                                 │
│   - Template / Manual / DeliveryRule                │
│   - Product / Order (キャッシュ)                     │
└─────────────────────────────────────────────────────┘
```

## 下書き生成フロー

```
1. ユーザが「下書きを生成」をクリック
2. POST /api/v1/inquiries/{id}/generate-draft
3. draft_composer.generate_draft_for_inquiry()
4. ├─ knowledge.build_knowledge_bundle()
5. │   ├─ load_shop_knowledge()      ← Template / Manual / DeliveryRule をDBから
6. │   ├─ rms.get_product()          ← 商品情報 (RMS API / 商品ページHTML)
7. │   ├─ rms.get_order() または
8. │   │   rms.find_orders_by_customer()  ← 注文情報
9. │   ├─ filter_manuals_for_product()    ← 商品紐付きマニュアル
10. │   └─ select_applicable_rules()      ← 商品ヒットの納期ルール
11. ├─ prompt_builder.build_system_prompt()  ← ペルソナ/署名
12. ├─ prompt_builder.build_user_prompt()    ← ナレッジを構造化テキスト化
13. └─ ai.generate()                  ← OpenAI / Mock
14. Draft を DB 保存 (prompt_snapshot, sources も記録)
```

## 拡張ポイント

### 別ECモールを追加

1. `app/integrations/rms/yahoo.py` を作成し `RMSProvider` を継承
2. `factory.py` の分岐に追加
3. `Shop.platform = "yahoo"` で利用可能に

### 別AIプロバイダを追加

1. `app/integrations/ai/gemini_provider.py` を作成し `AIProvider` を継承
2. `factory.py` の分岐に追加
3. `.env` の `AI_PROVIDER=gemini` で切替

### ナレッジ種別を追加 (例: FAQ)

1. `app/models/faq.py` を作成
2. `app/services/knowledge.py` の `KnowledgeBundle` に追加
3. `prompt_builder.py` で参考情報セクションを追加

## セキュリティ

- RMS資格情報は現状プレーンテキストでDBに保存。**本番投入前にKMS/暗号化必須**。
- 認証はJWT骨組みのみ。OrganizationごとのRow-Level Securityはまだ実装していない（API認証で `current_user.organization_id` フィルタを必ず噛ませる必要がある）。
- レートリミットは未実装。SaaS化時にRMS APIコールとAI APIコールの両方に必要。

## SaaS化に向けたTODO

- [x] JWT認証ミドルウェア + Organizationスコープのフィルタ強制
- [x] RMS資格情報の暗号化 (Fernet)
- [x] Gemini Provider 実装
- [ ] レートリミット (slowapi)
- [ ] 利用量計測 (AI APIトークン課金のため)
- [ ] バックグラウンドジョブ (Celery + Redis): 問い合わせポーリングの定期化
- [ ] Webhook対応: RMS から push されたら即取り込み
- [ ] 監査ログ (誰が・いつ・どの下書きを送信したか)
- [ ] 多言語対応 (英語UI)
- [ ] 暗号鍵のKMS連携（現状は環境変数）
- [ ] 商品ページのスクレイピングを robots.txt 準拠 / キャッシュ強化
