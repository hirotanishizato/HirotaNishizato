import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC2026 予想バトル | みんなのワールドカップ予想",
  description:
    "2026 ワールドカップの試合をテーマにみんなで予想を投票。架空ポイントで楽しむ無料の予想ゲームです（現実の金銭は一切賭けません）。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-[color:var(--background)]/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-b from-accent to-accent-strong text-[#06210f]">
                ⚽
              </span>
              <span className="text-lg tracking-tight">
                WC2026 <span className="text-accent">予想バトル</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-bold">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-foreground"
              >
                試合一覧
              </Link>
              <Link
                href="/mypage"
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-foreground"
              >
                マイページ
              </Link>
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-foreground"
              >
                管理
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-border/80 bg-surface/40">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-muted">
            <p className="font-bold text-foreground/90">
              ⚠️ これは無料の予想ゲームです
            </p>
            <p className="mt-1">
              本サイトで使用する「ポイント」は架空のものであり、現実の金銭・換金性は一切ありません。
              賞金・配当もゲーム内ポイントの演出です。日本の法律で禁止される賭博行為には該当しません。
            </p>
            <p className="mt-2 opacity-70">
              © 2026 WC2026 予想バトル — スポーツ予想を楽しむためのファンサイト
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
