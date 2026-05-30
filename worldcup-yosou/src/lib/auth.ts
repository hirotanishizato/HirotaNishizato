import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE } from "./constants";

// ── 管理画面の簡易認証 ───────────────────────────────────────
// 共有パスワード方式。環境変数 ADMIN_PASSWORD / ADMIN_SECRET で設定。
// （仮運用のためデフォルト値あり。公開時は必ず環境変数を設定すること）
//
//  ※本格運用では各管理者アカウント＋セッション管理への置き換えを推奨。

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin2026";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "dev-secret-change-me";

/** パスワードからセッショントークン(hex)を導出 */
export function adminToken(password: string): string {
  return createHash("sha256").update(`${password}::${ADMIN_SECRET}`).digest("hex");
}

const EXPECTED_TOKEN = adminToken(ADMIN_PASSWORD);

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** パスワードが正しいか */
export function verifyPassword(password: string): boolean {
  return safeEqual(adminToken(password), EXPECTED_TOKEN);
}

/** 現在のリクエストが管理者として認証済みか */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, EXPECTED_TOKEN);
}

/** 管理者専用ページ・アクションの先頭で呼ぶガード */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

/** ログイン成功時にCookieをセット */
export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, EXPECTED_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1週間
  });
}

/** ログアウト */
export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
