import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMatchDetail } from "@/lib/queries";
import {
  updateMatch,
  settleMatch,
  reopenMatch,
  deleteMatch,
  deleteBet,
} from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatDateTime,
  formatOdds,
  formatPoints,
  toDatetimeLocalJst,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) notFound();

  const hasBets = match.bets.length > 0;
  const settled = match.status === "SETTLED";
  const optionsText = match.pools.options.map((o) => o.label).join("\n");

  return (
    <div>
      <AdminHeader active="/admin" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin" className="text-sm font-bold text-muted hover:text-foreground">
            ← ダッシュボード
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold">{match.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StatusBadge status={match.status} />
            <span>{formatDateTime(match.kickoffAt)} 開始</span>
          </div>
        </div>
        <Link href={`/matches/${match.id}`} className="btn btn-ghost text-sm">
          公開ページを見る ↗
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 結果確定 ── */}
        <section className="card p-5">
          <h2 className="text-lg font-extrabold">結果を確定する</h2>
          <p className="mt-1 text-xs text-muted">
            的中となる選択肢にチェックを入れて確定します。確定すると、この試合の総プール
            （{formatPoints(match.pools.totalPool)}）が的中者へ賭け金に応じて配分されます。
          </p>

          {settled ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm">
                <div className="font-extrabold text-gold">
                  🏁 確定済み：{match.winnerLabels.join(" / ") || "的中者なし（返金）"}
                </div>
                {match.resultNote && (
                  <div className="mt-1 text-foreground/90">{match.resultNote}</div>
                )}
              </div>
              <form action={reopenMatch}>
                <input type="hidden" name="id" value={match.id} />
                <ConfirmButton
                  message="結果確定を取り消し、全ベットの払い戻しもリセットします。よろしいですか？"
                  className="btn btn-ghost text-sm"
                >
                  確定を取り消して再オープン
                </ConfirmButton>
              </form>
            </div>
          ) : (
            <form action={settleMatch} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={match.id} />
              <div className="grid gap-2">
                {match.pools.options.map((o) => (
                  <label
                    key={o.optionId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="winner"
                        value={o.optionId}
                        className="h-4 w-4 accent-[color:var(--accent)]"
                      />
                      <span className="font-bold">{o.label}</span>
                    </span>
                    <span className="text-xs text-muted">
                      {formatPoints(o.pool)}・{formatOdds(o.odds)}
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="label" htmlFor="resultNote">
                  結果メモ（最終スコア等・任意）
                </label>
                <input
                  id="resultNote"
                  name="resultNote"
                  className="input"
                  placeholder="例: 日本 2-1 カメルーン"
                />
              </div>
              <ConfirmButton
                message="結果を確定し、的中者へポイントを配分します。よろしいですか？"
                className="btn btn-primary w-full"
              >
                結果を確定する
              </ConfirmButton>
            </form>
          )}
        </section>

        {/* ── 試合情報の編集 ── */}
        <section className="card p-5">
          <h2 className="text-lg font-extrabold">試合情報の編集</h2>
          <form action={updateMatch} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={match.id} />
            <div>
              <label className="label" htmlFor="title">
                タイトル
              </label>
              <input
                id="title"
                name="title"
                className="input"
                defaultValue={match.title}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category">
                  カテゴリ
                </label>
                <input
                  id="category"
                  name="category"
                  className="input"
                  defaultValue={match.category}
                />
              </div>
              <div>
                <label className="label" htmlFor="kickoffAt">
                  開始＝締切（JST）
                </label>
                <input
                  id="kickoffAt"
                  name="kickoffAt"
                  type="datetime-local"
                  className="input"
                  defaultValue={toDatetimeLocalJst(match.kickoffAt)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="description">
                詳細説明
              </label>
              <textarea
                id="description"
                name="description"
                className="textarea"
                rows={2}
                defaultValue={match.description}
              />
            </div>
            <div>
              <label className="label" htmlFor="options">
                選択肢（1行に1つ）
              </label>
              <textarea
                id="options"
                name="options"
                className="textarea"
                rows={4}
                defaultValue={optionsText}
                disabled={hasBets}
              />
              {hasBets && (
                <p className="mt-1 text-xs text-amber-300">
                  すでに投票があるため、選択肢は変更できません（既存投票の保護）。
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              更新する
            </button>
          </form>
        </section>
      </div>

      {/* ── 投票一覧（管理） ── */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">
          投票一覧（{match.bets.length}件）
        </h2>
        {match.bets.length === 0 ? (
          <p className="card p-6 text-sm text-muted">まだ投票はありません。</p>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">名前</th>
                    <th className="px-4 py-3 font-bold">予想</th>
                    <th className="px-4 py-3 font-bold text-right">投票</th>
                    <th className="px-4 py-3 font-bold text-right">払戻</th>
                    <th className="px-4 py-3 font-bold">日時</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {match.bets.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-2/50">
                      <td className="px-4 py-3 font-bold">{b.userName}</td>
                      <td className="px-4 py-3 text-muted">{b.optionLabel}</td>
                      <td className="px-4 py-3 text-right">
                        {formatPoints(b.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.isSettled ? (
                          <span
                            className={b.isHit ? "font-bold text-accent" : "text-muted"}
                          >
                            {b.isHit ? formatPoints(b.payout) : "—"}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDateTime(b.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteBet}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <ConfirmButton
                            message="この投票を削除します。よろしいですか？"
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
      </section>

      {/* ── 危険操作 ── */}
      <section className="mt-6 card border-danger/30 p-5">
        <h2 className="text-lg font-extrabold text-red-300">この試合を削除</h2>
        <p className="mt-1 text-xs text-muted">
          試合・選択肢・投票がすべて削除されます。元に戻せません。
        </p>
        <form action={deleteMatch} className="mt-3">
          <input type="hidden" name="id" value={match.id} />
          <ConfirmButton
            message={`「${match.title}」を完全に削除します。よろしいですか？`}
            className="btn btn-danger"
          >
            試合を削除する
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
