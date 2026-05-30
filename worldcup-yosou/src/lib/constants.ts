// 試合ステータス
export const MATCH_STATUS = {
  OPEN: "OPEN", // 受付中（締め切り前）
  CLOSED: "CLOSED", // 締め切り済み・結果待ち
  SETTLED: "SETTLED", // 結果確定済み
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export const MATCH_STATUS_LABEL: Record<string, string> = {
  OPEN: "受付中",
  CLOSED: "締切",
  SETTLED: "確定",
};

// 表示用タイムゾーン（日本向けローカライズ）
export const DISPLAY_TIMEZONE = "Asia/Tokyo";

// 管理画面 認証用Cookie名
export const ADMIN_COOKIE = "wc_admin";

// フロントの名前キャッシュに使う localStorage キー
export const USERNAME_STORAGE_KEY = "wc_username";
