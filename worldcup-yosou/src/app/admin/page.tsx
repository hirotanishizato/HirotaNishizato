import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getMatchSummaries } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const matches = await getMatchSummaries();

  const open = matches.filter((m) => m.status === "OPEN").length;
  const closed = matches.filter((m) => m.status === "CLOSED").length;
  const settled = matches.filter((m) => m.status === "SETTLED").length;

  return (
    <div>
      <AdminHeader active="/admin" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">ダッシュボード</h1>
          <p className="mt-1 text-sm text-muted">
            登録 {matches.length} 試合 ／ 受付中 {open}・締切 {closed}・確定 {settled}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/matches/new" className="btn btn-primary">
            ＋ 試合を追加
          </Link>
          <Link href="/admin/import" className="btn btn-ghost">
            CSV一括登録
          </Link>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          まだ試合がありません。「試合を追加」または「CSV一括登録」から登録してください。
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">試合</th>
                  <th className="px-4 py-3 font-bold">開始＝締切</th>
                  <th className="px-4 py-3 font-bold">状態</th>
                  <th className="px-4 py-3 font-bold text-right">投票</th>
                  <th className="px-4 py-3 font-bold text-right">プール</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="font-bold">{m.title}</div>
                      {m.category && (
                        <div className="text-xs text-muted">{m.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(m.kickoffAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {m.totalBets}票
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatPoints(m.totalPool)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/matches/${m.id}`}
                        className="font-bold text-accent hover:underline"
                      >
                        管理 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
