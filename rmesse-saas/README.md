# R-Messe Inquiry SaaS

楽天市場 R-Messe 問い合わせ管理 + AI下書き生成 SaaS。

## 概要

- 楽天RMS API 経由で R-Messe の問い合わせを取得し、ツール上で一覧・閲覧
- OpenAI / Gemini を使って自動返信下書きを生成（最終チェックは人間）
- 下書き生成時に活用する追加情報:
  - クライアント独自の **テンプレート**
  - 商品/ソフトの **マニュアル**
  - **納期ルール**（曜日・カットオフ時間・地域）
  - 楽天商品ページ情報（商品が特定できる場合）
  - 既存注文者の **注文情報**（含・納期記載）

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Next.js (FE)   │ ──> │ FastAPI (BE)    │ ──> │ PostgreSQL      │
└─────────────────┘     └────┬────────────┘     └─────────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Rakuten  │  │ OpenAI   │  │ (Gemini) │
        │   RMS    │  │          │  │ (将来)   │
        └──────────┘  └──────────┘  └──────────┘
```

### 拡張性のための設計判断

| 設計 | 目的 |
|---|---|
| マルチテナント（Organization → Shop） | 外部パートナー / SaaS提供のため最初から複数テナント前提 |
| RMSプロバイダ抽象化 (`RMSProvider`) | 楽天以外のモール(Yahoo, Amazon等)を後で差し込める |
| AIプロバイダ抽象化 (`AIProvider`) | OpenAI / Gemini / Anthropic を環境変数で切替 |
| Draft Composer パイプライン | 「テンプレート選定 → 情報収集 → プロンプト構築 → 生成」を疎結合 |
| Pluginable Knowledge Source | テンプレート/マニュアル/納期ルールを `KnowledgeSource` として統一 |
| Job Queue (将来 Celery/RQ) | 問い合わせ取得・下書き生成を非同期化 |
| API-first (OpenAPI 自動生成) | 将来の社外API公開・別フロント実装に対応 |

## ディレクトリ

```
rmesse-saas/
  backend/
    app/
      api/v1/             REST endpoints
      core/               config, security
      db/                 SQLAlchemy base, session
      models/             ORM models
      schemas/            Pydantic schemas
      services/           ビジネスロジック (draft composer など)
      integrations/
        rms/              RMS providers (Rakuten 実装 + 抽象基底)
        ai/               AI providers (OpenAI 実装 + 抽象基底)
    alembic/              DB migrations
    tests/
  frontend/               Next.js 14 (App Router)
  docs/
  docker-compose.yml
```

## 環境変数

`.env.example` をコピーして `.env` を作成。

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL URL (dev は SQLite でも可) |
| `OPENAI_API_KEY` | OpenAI APIキー |
| `AI_PROVIDER` | `openai` / `gemini` (default: openai) |
| `AI_MODEL` | デフォルト: `gpt-4o-mini` |
| `JWT_SECRET` | JWT署名キー |
| `RMS_MOCK_MODE` | `true` でRMS APIをモック化（開発用） |

## ローカル起動

```bash
# 1. backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# 2. frontend
cd ../frontend
npm install
npm run dev
```

または docker-compose:

```bash
docker compose up --build
```

## 開発ロードマップ

- [x] プロジェクト骨組み
- [x] データモデル設計
- [x] RMS/AIプロバイダ抽象化
- [x] 下書き生成パイプライン
- [ ] フロントエンド (問い合わせ一覧/詳細)
- [ ] 実RMS APIキーでの動作確認（要クライアント提供）
- [ ] 認証 (Organization単位)
- [ ] 非同期ジョブ化 (Celery)
- [ ] 監査ログ・利用量計測
