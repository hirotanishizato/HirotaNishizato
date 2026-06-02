# Chatwork × Claude 連携ボット

Chatworkで **特定のアカウントがメンションされた** メッセージを受け取り、
内容を **Claude(Anthropic API)** で処理して、同じ部屋に自動返信するボットです。

```
[ユーザー] ──@メンション投稿──▶ [Chatwork]
                                   │  Webhook(POST /chatwork/webhook)
                                   ▼
                            [このサーバー]
                             1. 署名を検証
                             2. 自分の投稿は無視(無限ループ防止)
                             3. 本文を Claude へ
                             4. Chatwork API で同じ部屋に返信
```

- **1問1答**(会話履歴は保持しません)
- 反応条件は Chatwork 側の Webhook 設定で「**アカウントイベント → ご自身へのメンション**」を選ぶことで実現します

---

## 1. セットアップ(ローカル)

```bash
cd chatwork-claude-bot
npm install
cp .env.example .env   # 値を埋める
npm run dev            # または npm start
```

必要な環境変数(`.env.example` 参照):

| 変数 | 中身 | 取得元 |
|---|---|---|
| `CHATWORK_API_TOKEN` | Chatwork操作用トークン | Chatwork「APIトークン」画面 |
| `CHATWORK_WEBHOOK_TOKEN` | 署名検証用トークン | Webhook作成後に表示される |
| `ANTHROPIC_API_KEY` | Claude APIキー | Anthropicコンソール |
| `CLAUDE_MODEL`(任意) | 使用モデル | 既定 `claude-sonnet-4-6` |
| `SYSTEM_PROMPT`(任意) | 役割・口調の指示 | 既定は丁寧な日本語アシスタント |

> ⚠️ APIトークンを一度どこか(チャット等)に貼ってしまった場合は、必ず**再発行**してから使ってください。

---

## 2. デプロイ(Render)

リポジトリ直下の `render.yaml`(Blueprint)に `chatwork-claude-bot` サービスを定義済みです。

1. Render ダッシュボード → New → Blueprint → このリポジトリを選択
2. `chatwork-claude-bot` サービスの **Environment** に上記の秘密情報を設定
3. デプロイ後、公開URLが発行される
   → Webhook URL は **`https://<発行されたドメイン>/chatwork/webhook`**

> ⚠️ Render の **free プラン** はアイドルでスリープします。スリープ復帰時の初回Webhookは
> コールドスタートで取りこぼす可能性があるため、本番運用では **starter 以上** を推奨します。

---

## 3. Chatwork 側の Webhook 設定

Chatwork:「サービス連携 → Webhook → Webhookの新規作成」で以下を入力します。

| 項目 | 値 |
|---|---|
| Webhook名 | 任意(例: `Claude Bot`) |
| Webhook URL | `https://<発行されたドメイン>/chatwork/webhook` |
| イベント | **アカウントイベント** → **ご自身へのメンション** |

「作成」すると **Webhookトークン** が表示されるので、その値を
`CHATWORK_WEBHOOK_TOKEN`(Renderの環境変数)に設定してください。

設定後、対象アカウントを `[To:...]` でメンションして話しかけると、Claudeが返信します。

---

## 4. 将来の拡張(Googleサービス連携)

Googleスプレッドシートへの書き込みなどを足す場合は、`src/claude.js` に
Claudeの **tools(function calling)** を定義し、応答に `tool_use` が含まれたら
対応するツール(例: Sheets API呼び出し)を実行 → 結果を `tool_result` として
返し直すループを追加します。受信・返信ロジック(`src/index.js`)はそのまま使えます。

---

## ファイル構成

```
chatwork-claude-bot/
├── package.json
├── .env.example
├── README.md
└── src/
    ├── index.js      # Expressサーバー / Webhook受信・署名検証・返信
    ├── chatwork.js   # Chatwork API クライアント
    ├── claude.js     # Claude(Anthropic)呼び出し
    └── config.js     # 環境変数の読み込み・検証
```
