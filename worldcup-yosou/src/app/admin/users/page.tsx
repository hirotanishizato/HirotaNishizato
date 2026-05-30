import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getUsersOverview } from "@/lib/queries";
import { deleteUser } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { formatDateTime, formatPoints, formatSignedPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getUsersOverview();

  return (
    <div>
      <AdminHeader active="/admin/users" />
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">ユーザー（名前）一覧</h1>
        <p className="mt-1 text-sm text-muted">
          フロントで投票された名前をもとに自動構築されます。プルダウンの候補にもなります。
          現在 {users.length} 名。
        </p>
      </div>

      {users.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          まだユーザーがいません。フロントで投票すると自動で登録されます。
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">名前</th>
                  <th className="px-4 py-3 font-bold text-right">投票数</th>
                  <th className="px-4 py-3 font-bold text-right">賭け総額</th>
                  <th className="px-4 py-3 font-bold text-right">確定損益</th>
                  <th className="px-4 py-3 font-bold text-right">的中</th>
                  <th className="px-4 py-3 font-bold">最終投票</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-bold">
                      <Link
                        href={`/mypage?name=${encodeURIComponent(u.name)}`}
                        className="hover:text-accent"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{u.betCount}</td>
                    <td className="px-4 py-3 text-right">
                      {formatPoints(u.totalStaked)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        u.netSettled >= 0 ? "text-accent" : "text-red-300"
                      }`}
                    >
                      {u.settledCount > 0 ? formatSignedPoints(u.netSettled) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {u.hitCount}/{u.settledCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {u.lastBetAt ? formatDateTime(u.lastBetAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <ConfirmButton
                          message={`「${u.name}」と、その全投票を削除します。よろしいですか？`}
                          className="text-xs font-bold text-danger hover:underline"
                        >
                          削除
                        </ConfirmButton>
                      </form>
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
