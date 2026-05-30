import { DISPLAY_TIMEZONE } from "./constants";

// 日付＋時刻（JST） 例: 2026/06/15 (月) 19:00
export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// 日付のみ（JST） 例: 2026/06/15 (月)
export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(d);
}

// 時刻のみ（JST） 例: 19:00
export function formatTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ポイント（架空の金額）表示 例: 12,000 pt
export function formatPoints(value: number): string {
  return `${Math.round(value).toLocaleString("ja-JP")} pt`;
}

// 符号付きポイント（損益用） 例: +3,200 pt / -1,000 pt
export function formatSignedPoints(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("ja-JP")} pt`;
}

// <input type="datetime-local"> 用の値（JST）を生成 例: 2026-06-15T19:00
export function toDatetimeLocalJst(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// オッズ表示 例: 2.50倍
export function formatOdds(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "—";
  return `${value.toFixed(2)}倍`;
}
