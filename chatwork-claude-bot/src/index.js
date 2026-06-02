// Chatwork × Claude 連携ボットのエントリポイント。
//
// 流れ:
//   1. Chatworkの Webhook(POST) を受ける
//   2. 署名を検証(なりすまし防止)
//   3. Chatworkを待たせないよう先に 200 を返す
//   4. 本文をClaudeに渡し、返答を同じ部屋に投稿する
import express from "express";
import crypto from "node:crypto";
import { config } from "./config.js";
import { getMe, postMessage, stripChatworkTags } from "./chatwork.js";
import { askClaude } from "./claude.js";

const app = express();

// 署名検証には「生の」リクエストボディが必要なので raw のまま受け取る。
app.use("/chatwork/webhook", express.raw({ type: "*/*" }));

let botAccountId = null; // 起動時に取得。自分の投稿を無視するために使う。
const processed = new Set(); // message_id の重複処理を防ぐ(Webhook再送対策)。

// ヘルスチェック(Renderの healthCheckPath 用)
app.get("/", (_req, res) => res.status(200).send("ok"));

// Chatwork Webhook 受信エンドポイント
app.post("/chatwork/webhook", (req, res) => {
  // 1〜2. 署名検証
  if (!verifySignature(req)) {
    return res.status(401).send("invalid signature");
  }

  // 3. Chatworkを待たせないため、先に200を返してから非同期で処理する
  res.status(200).send("ok");

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    console.error("ペイロードのJSON解析に失敗しました");
    return;
  }
  handleEvent(payload).catch((err) => console.error("処理中のエラー:", err));
});

// Webhook署名(X-ChatWorkWebhookSignature)を検証する。
// 期待値 = Base64( HMAC-SHA256( リクエストボディ, base64decode(Webhookトークン) ) )
function verifySignature(req) {
  const signature = req.header("x-chatworkwebhooksignature");
  if (!signature) return false;

  const key = Buffer.from(config.chatwork.webhookToken, "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(req.body)
    .digest("base64");

  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  return (
    received.length === computed.length &&
    crypto.timingSafeEqual(received, computed)
  );
}

// 1件のWebhookイベントを処理する。
async function handleEvent(payload) {
  const event = payload.webhook_event || {};
  const { from_account_id, room_id, message_id, body } = event;

  // 重複処理を防ぐ(同じ message_id が再送されても1回だけ処理)
  if (message_id) {
    if (processed.has(message_id)) return;
    processed.add(message_id);
    if (processed.size > 1000) processed.clear(); // メモリ肥大化の簡易対策
  }

  // 自分(ボット)の投稿には反応しない(無限ループ防止)
  if (botAccountId && String(from_account_id) === String(botAccountId)) return;

  const userText = stripChatworkTags(body || "");
  if (!userText) return;

  const answer = await askClaude(userText);

  // 元の発言者に引用返信する
  const reply = `[rp aid=${from_account_id} to=${room_id}-${message_id}]\n${answer}`;
  await postMessage(room_id, reply);
}

async function start() {
  // 自分のaccount_idを取得しておく(無限ループ防止に使用)
  try {
    const me = await getMe();
    botAccountId = me.account_id;
    console.log(`ボットの account_id: ${botAccountId} (${me.name})`);
  } catch (err) {
    console.error("起動時の /me 取得に失敗しました(処理は続行します):", err.message);
  }

  app.listen(config.port, () => {
    console.log(`Chatwork × Claude ボットをポート ${config.port} で起動しました`);
  });
}

start();
