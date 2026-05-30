import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail, getUserNames } from "@/lib/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { Countdown } from "@/components/Countdown";
import { OddsTable } from "@/components/OddsTable";
import { BetForm } from "@/components/BetForm";
import {
  formatDateTime,
  formatOdds,
  formatPoints,
  formatSignedPoints,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, names] = await Promise.all([getMatchDetail(id), getUserNames()]);
  if (!match) notFound();

  const settled = match.status === "SETTLED";
  const open = match.status === "OPEN";

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-bold text-muted hover:text-foreground">
        ← 試合一覧に戻る
      </Link>

      {/* ヘッダー */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={match.status} />
            {match.category && (
              <span className="badge border border-border bg-surface-2 text-muted">
                {match.category}
              </span>
            )}
          </div>
          <Countdown kickoffIso={match.kickoffAt.toISOString()} settled={settled} />
        </div>

        <h1 className="mt-3 text-2xl font-extrabold leading-tight">
          {match.title}
        </h1>
        <p className="mt-1 text-sm text-muted">
          🗓 {formatDateTime(match.kickoffAt)} キックオフ
          <span className="ml-1 text-foreground/80">＝ 投票締切</span>
        </p>
        {match.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {match.description}
          </p>
        )}

        {settled && (
          <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <div className="text-sm font-extrabold text-gold">
              🏁 結果確定：{match.winnerLabels.join(" / ") || "（的中者なし＝返金）"}
            </div>
            {match.resultNote && (
              <div className="mt-1 text-sm text-foreground/90">
                {match.resultNote}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* 左：オッズと投票状況 */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-extrabold">オッズ・投票状況</h2>
            <OddsTable
              options={match.pools.options}
              totalPool={match.pools.totalPool}
              settled={settled}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold">
              投票一覧（{match.bets.length}件）
            </h2>
            {match.bets.length === 0 ? (
              <p className="card p-6 text-sm text-muted">
                まだ投票がありません。最初の予想を投票しよう！
              </p>
            ) : (
              <div className="card divide-y divide-border/70">
                {match.bets.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold">{b.userName}</div>
                      <div className="text-xs text-muted">
                        {b.optionLabel} に {formatPoints(b.amount)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {b.isSettled ? (
                        <>
                          <div
                            className={`font-extrabold ${
                              b.isHit ? "text-accent" : "text-muted"
                            }`}
                          >
                            {b.isHit
                              ? `的中 ${formatPoints(b.payout)}`
                              : "はずれ"}
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              b.payout - b.amount >= 0
                                ? "text-accent"
                                : "text-red-300"
                            }`}
                          >
                            {formatSignedPoints(b.payout - b.amount)}
                          </div>
                        </>
                      ) : (
                        <span className="badge border border-border bg-surface-2 text-muted">
                          結果待ち
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 右：投票フォーム or 締切表示 */}
        <div className="space-y-4">
          {open ? (
            <BetForm
              matchId={match.id}
              names={names}
              options={match.pools.options.map((o) => ({
                id: o.optionId,
                label: o.label,
                odds: o.odds,
              }))}
            />
          ) : (
            <div className="card p-5">
              <h3 className="text-base font-extrabold">
                {settled ? "この試合は結果確定済みです" : "投票は締め切られました"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {settled
                  ? "的中した予想にはプールから払い戻しが行われました。"
                  : "試合開始時刻を過ぎたため、新しい投票はできません。結果の確定をお待ちください。"}
              </p>
              {settled && (
                <div className="mt-4 grid gap-2">
                  {match.pools.options
                    .filter((o) => o.isWinner)
                    .map((o) => (
                      <div
                        key={o.optionId}
                        className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3"
                      >
                        <span className="font-bold text-gold">
                          🏆 {o.label}
                        </span>
                        <span className="font-extrabold text-gold">
                          {formatOdds(o.odds)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              <Link href="/mypage" className="btn btn-ghost mt-4 w-full">
                マイページで結果を確認
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
