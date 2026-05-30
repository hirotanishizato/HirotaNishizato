# ⚽ WC2026 予想バトル

2026年ワールドカップの試合をテーマにした、**みんなで予想を投票する擬似ベッティング型の予想ゲームサイト**です。
海外スポーツベッティングの体験を、日本向けに「無料の予想ゲーム」としてローカライズした構成になっています。

> [!IMPORTANT]
> **これは現実の金銭を一切賭けないゲームです。**
> サイト内の「ポイント」「賞金」「配当」はすべて**架空**であり、換金性はありません。
> 所持金の概念もなく、誰がいくら投票するかは自由です。日本の法律で禁止される賭博行為には該当しません。
> （技術的にスポーツベッティング“風”の体験を再現するための演出です。）

---

## 何ができるか

### フロント（投票サイト）
- **試合一覧** … 受付中 / 締切 / 結果確定 の状態別に表示。各試合のオッズ・総プール・締切カウントダウン付き。
- **試合詳細** … 「誰がどの予想にいくら投票したか」、現在のオッズ、結果確定後の払い戻しを表示。
  - **投票フォーム** … 名前 + 予想（選択肢）+ ポイントを入力して投票。所持金制限なし・金額自由。
  - **名前のプルダウン** … 初回は空欄のテキスト入力。2回目以降は過去に使われた名前を `▼` から選択可能。
  - **名前のキャッシュ** … 一度入力した名前は端末（localStorage）に保存され、次回以降も保持。
- **マイページ** … 名前ごとに、進行中の投票・確定損益・受取総額・的中率・投票履歴・ポイント獲得履歴を表示。
- **締切カウントダウン** … 「締切まで 残り◯分」を常時表示（締切＝試合開始時刻）。

### 管理画面（`/admin`）
- **試合のDB登録** … タイトル / カテゴリ / 詳細 / 試合開始（＝締切）/ 複数の選択肢 を登録。
- **CSV一括登録** … 多数の試合をまとめて登録（ファイルアップロード or 貼り付け）。
- **結果確定** … 的中選択肢を選んで確定。総プールを的中者へ賭け金比率で配分（パリミュチュエル方式）。
- **ユーザー管理** … 投票で自動構築される名前一覧と、各ユーザーの損益・的中率を確認。
- 結果確定の取り消し、投票・試合・ユーザーの削除も可能。

---

## 擬似ベッティングの仕組み（パリミュチュエル方式）

実在のブックメーカーと同じく、賭け金プールを的中者で山分けする方式です。

- **オッズ（配当倍率）** = `その試合の総投票額 ÷ その選択肢への投票額`
- **的中者の払い戻し** = `自分の投票額 × オッズ`（= 賭け金比率での総プール山分け）
- **損益** = `払い戻し − 投票額`（外れた場合は `−投票額`）
- 的中者が居ない（または勝ち選択肢未設定）の場合は**全額返金**。

ロジックは `src/lib/odds.ts` に純関数として実装しています。

---

## 技術スタック

| 種別 | 採用 |
| --- | --- |
| フレームワーク | Next.js 16（App Router / Server Actions / Route Handlers） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| DB / ORM | Prisma 7 + `@prisma/adapter-pg` |
| データベース | PostgreSQL（ローカル・本番とも同一でparity確保） |
| ホスティング（想定） | Render（Web Service + Managed Postgres） |

---

## ローカル開発

前提：ローカルに **PostgreSQL** が必要です（未導入なら Docker が手軽）。

```bash
# 0.（任意）Docker で使い捨てPostgresを起動する例
docker run --name wc-pg -e POSTGRES_USER=wc -e POSTGRES_PASSWORD=wc \
  -e POSTGRES_DB=worldcup -p 5432:5432 -d postgres:16

# 1. 依存をインストール（postinstall で prisma generate も実行されます）
npm install

# 2. 環境変数を用意（DATABASE_URL に自分のPostgres接続文字列を設定）
cp .env.example .env
#   例: DATABASE_URL="postgresql://wc:wc@127.0.0.1:5432/worldcup"

# 3. DBを作成（マイグレーション適用）
npm run db:migrate

# 4. サンプルデータを投入（任意・デモ用の試合と投票が入ります）
npm run db:seed

# 5. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

- フロント： http://localhost:3000
- 管理画面： http://localhost:3000/admin
  - 初期パスワード（仮）：`admin2026`（`.env` の `ADMIN_PASSWORD` で変更）

### よく使うスクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド（`prisma generate` 込み） |
| `npm run db:migrate` | マイグレーション作成・適用（開発） |
| `npm run db:seed` | サンプルデータ投入 |
| `npm run db:reset` | DBリセット |
| `npm run db:studio` | Prisma Studio でデータ閲覧 |

---

## CSV一括登録フォーマット

1行＝1試合。1行目のヘッダー行は任意（あってもなくても可）。

```csv
title,category,description,kickoffAt,options
日本 vs カメルーン,グループD,予選第1戦,2026-06-15 19:00,日本勝利|引き分け|カメルーン勝利
アルゼンチン vs ブラジル,注目カード,南米対決,2026-06-20 09:00,アルゼンチン勝利|引き分け|ブラジル勝利
```

| 列 | 内容 | 必須 |
| --- | --- | --- |
| `title` | 試合タイトル | ✅ |
| `category` | カテゴリ／大会・グループ | |
| `description` | 詳細説明 | |
| `kickoffAt` | 試合開始＝締切。`YYYY-MM-DD HH:mm`（**日本時間**）または ISO8601 | ✅ |
| `options` | 選択肢を `\|` 区切りで2つ以上 | ✅ |

---

## デプロイ（Render）

リポジトリ直下の **`render.yaml`（Blueprint）** で Web Service と Managed Postgres を一括作成できます。
（このアプリは `worldcup-yosou/` 配下のため、Blueprint では `rootDir: worldcup-yosou` を指定済み）

1. [Render](https://render.com) にログイン → **New → Blueprint** → このリポジトリを選択。
2. `render.yaml` が読み込まれ、**Web Service（Next.js）** と **PostgreSQL** が作成されます。
   - `DATABASE_URL` は作成されたDBから自動注入
   - `ADMIN_SECRET` は自動生成
   - ビルド時に `prisma migrate deploy` が走り、スキーマが適用されます
3. デプロイ後、Web Service の **Environment** で `ADMIN_PASSWORD` を強固な値に設定
   （未設定でも仮値 `admin2026` で動作します）。
4. 公開URLにアクセスして動作確認。管理画面は `/admin`。

> **補足**
> - `free` プランはアイドルでスリープ（初回アクセスが遅い）、無料Postgresは保持期間に制限があります。本番運用は `starter` 以上を推奨。
> - Web Service と Postgres は**同一リージョン**にしてください（`render.yaml` では `singapore` を指定）。
> - ダッシュボードから手動構築する場合は、Root Directory を `worldcup-yosou`、Build Command を
>   `npm ci && npx prisma migrate deploy && npm run build`、Start Command を `npm run start` に設定します。

### 他プラットフォーム（Vercel 等）に変える場合
サーバーレスでは外部 Postgres（Neon 等）を使い、`DATABASE_URL` / `ADMIN_PASSWORD` / `ADMIN_SECRET` を
環境変数に設定し、デプロイ時に `prisma migrate deploy` を実行すれば動作します（コード変更は不要）。

---

## ディレクトリ構成（抜粋）

```
src/
├─ app/
│  ├─ page.tsx                 # 試合一覧（ホーム）
│  ├─ matches/[id]/page.tsx    # 試合詳細・投票
│  ├─ mypage/page.tsx          # マイページ
│  ├─ actions.ts               # 投票（placeBet）サーバーアクション
│  └─ admin/                   # 管理画面（試合登録/CSV/結果確定/ユーザー）
│     ├─ actions.ts            # 管理用サーバーアクション
│     └─ ...
├─ components/                 # UI コンポーネント（BetForm, Countdown, OddsTable 等）
└─ lib/
   ├─ odds.ts                  # オッズ/配当計算（パリミュチュエル・純関数）
   ├─ queries.ts               # データ取得・集計
   ├─ csv.ts                   # CSVパーサ
   ├─ auth.ts                  # 管理画面の簡易認証
   ├─ format.ts                # 日付・ポイント・オッズの表示整形（JST）
   └─ prisma.ts                # Prisma クライアント（ドライバアダプタ）
prisma/
├─ schema.prisma              # データモデル（Match / Option / Bet / User）
└─ seed.ts                    # サンプルデータ
```

---

## 注意・免責
本サイトはスポーツ予想を楽しむためのファン向けゲームです。実際の金銭の授受・賭博を目的としたものではありません。
