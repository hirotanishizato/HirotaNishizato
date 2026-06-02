// 環境変数の読み込みと検証。
// 秘密情報(APIトークン等)はすべて環境変数から取得し、コードには書かない。
const required = [
  "CHATWORK_API_TOKEN", // Chatworkの操作用トークン(送信・/me に使用)
  "CHATWORK_WEBHOOK_TOKEN", // Webhook署名検証用トークン
  "ANTHROPIC_API_KEY", // Claude APIキー
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `必須の環境変数が未設定です: ${missing.join(", ")}\n` +
      ".env または Render の環境変数に設定してください。",
  );
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 3000,

  chatwork: {
    apiToken: process.env.CHATWORK_API_TOKEN,
    webhookToken: process.env.CHATWORK_WEBHOOK_TOKEN,
    apiBase: "https://api.chatwork.com/v2",
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    // 用途(チャット返信)に対して応答が速く費用も抑えやすい Sonnet を既定に。
    // より高性能にしたい場合は CLAUDE_MODEL=claude-opus-4-8 などに変更する。
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    maxTokens: Number(process.env.CLAUDE_MAX_TOKENS) || 1024,
    systemPrompt:
      process.env.SYSTEM_PROMPT ||
      "あなたはChatwork上で動作する丁寧な日本語アシスタントです。" +
        "相手に敬意を持ち、簡潔で分かりやすい言葉で回答してください。",
  },
};
