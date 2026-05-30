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
| DB / ORM | Prisma 7 + ドライバアダプタ |
| ローカルDB | SQLite（`better-sqlite3` アダプタ） |
| 本番DB（想定） | PostgreSQL（Vercel Postgres / Neon / Supabase 等） |

---

## ローカル開発

```bash
# 1. 依存をインストール（postinstall で prisma generate も実行されます）
npm install

# 2. 環境変数を用意
cp .env.example .env        # 必要に応じて ADMIN_PASSWORD 等を編集

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

## デプロイ（Vercel / ホスティングは後日設定）

> ホスティング（Vercel）と本番DBのアカウントは**後で用意する前提**のため、現状はローカルSQLITEで動作する“仮”構成です。
> 本番公開時は以下の手順で Postgres に切り替えてください。

1. **Postgres を用意**（Vercel Postgres / Neon / Supabase など）し、接続文字列を取得。
2. **アダプタを追加**：`npm i @prisma/adapter-pg`
3. **`prisma/schema.prisma`** の datasource を変更：
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
4. **`src/lib/prisma.ts`** を PostgreSQL アダプタに差し替え（ファイル内のコメント参照）：
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```
5. **`prisma/seed.ts`** のアダプタも同様に差し替え（任意）。
6. **Vercel の環境変数**を設定：
   - `DATABASE_URL`（Postgres 接続文字列）
   - `ADMIN_PASSWORD`（管理画面パスワード）
   - `ADMIN_SECRET`（セッション署名用のランダム文字列）
7. デプロイ後、`npx prisma migrate deploy` でスキーマを適用。

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
