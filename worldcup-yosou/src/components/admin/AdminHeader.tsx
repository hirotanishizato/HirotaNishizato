import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/matches/new", label: "試合を追加" },
  { href: "/admin/import", label: "CSV一括登録" },
  { href: "/admin/users", label: "ユーザー" },
];

export function AdminHeader({ active }: { active?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <nav className="flex flex-wrap gap-1 text-sm font-bold">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-lg px-3 py-1.5 ${
              active === n.href
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <form action={logoutAdmin}>
        <button type="submit" className="btn btn-ghost text-sm">
          ログアウト
        </button>
      </form>
    </div>
  );
}
