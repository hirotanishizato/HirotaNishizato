// Chatwork REST API クライアント(必要最小限)。
import { config } from "./config.js";

const { apiToken, apiBase } = config.chatwork;

// 自分(ボット)自身のアカウント情報を取得する。
// 起動時に1回呼び、自分の投稿を無視する(無限ループ防止)ために account_id を使う。
export async function getMe() {
  const res = await fetch(`${apiBase}/me`, {
    headers: { "X-ChatWorkToken": apiToken },
  });
  if (!res.ok) {
    throw new Error(`Chatwork /me に失敗: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// 指定の部屋にメッセージを投稿する。
export async function postMessage(roomId, body) {
  const res = await fetch(`${apiBase}/rooms/${roomId}/messages`, {
    method: "POST",
    headers: {
      "X-ChatWorkToken": apiToken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ body }),
  });
  if (!res.ok) {
    throw new Error(`Chatwork 投稿に失敗: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Chatwork独自の装飾タグ([To:..] [rp ..] [piconname:..] など)を除去し、
// Claudeに渡しやすい素のテキストにする。
export function stripChatworkTags(text) {
  return text.replace(/\[[^\]]*\]/g, "").trim();
}
