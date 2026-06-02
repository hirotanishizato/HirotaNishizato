// Claude (Anthropic Messages API) 呼び出し。
//
// 現状は「1問1答」のシンプルな構成。
// 将来 Googleスプレッドシート連携などを足す場合は、ここに tools(function calling)を
// 定義し、応答が tool_use を含むときに各ツールを実行 → 結果を tool_result として
// 渡し直すループを追加する。受信・返信ロジック(index.js)はそのまま使い回せる。
import { config } from "./config.js";

const { apiKey, model, maxTokens, systemPrompt } = config.claude;

// ユーザーの発言テキストを渡し、Claudeの返答テキストを返す。
export async function askClaude(userText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API に失敗: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text || "(応答を生成できませんでした)";
}
