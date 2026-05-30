import Link from "next/link";
import { getUserNames, getUserSummary, type UserBetView } from "@/lib/queries";
import { MyPageNamePicker } from "@/components/MyPageNamePicker";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatDateTime,
  formatPoints,
  formatSignedPoints,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const decoded = (name ?? "").trim();
  const [names, summary] = await Promise.all([
    getUserNames(),
    decoded ? getUserSummary(decoded) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">マイページ</h1>
        <p className="mt-1 text-sm text-muted">
          自分の投票履歴・損益・獲得ポイントを確認できます。
        </p>
      </div>

      <MyPageNamePicker
        names={names}
        currentName={summary ? summary.name : ""}
        compact={!!summary}
      />

      {decoded && !summary && (
        <div className="card p-6 text-sm text-muted">
          「{decoded}」名義の投票はまだありません。試合ページから予想を投票してみましょう。
        </div>
      )}

      {summary && (
        <>
          {/* 損益サマリー */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="確定損益"
              value={formatSignedPoints(summary.netSettled)}
              tone={summary.netSettled >= 0 ? "good" : "bad"}
              big
            />
            <StatCard label="賭けた総額" value={formatPoints(summary.totalStaked)} />
            <StatCard
              label="受取総額（確定）"
              value={formatPoints(summary.totalPayout)}
              tone="gold"
            />
            <StatCard
              label="的中率"
              value={
                summary.settledCount > 0
                  ? `${Math.round((summary.hitCount / summary.settledCount) * 100)}%`
                  : "—"
              }
              sub={`${summary.hitCount} / ${summary.settledCount} 的中`}
            />
          </section>

          {summary.pendingStaked > 0 && (
            <p className="text-sm text-muted">
              結果待ちで拘束中：{" "}
              <span className="font-bold text-foreground">
                {formatPoints(summary.pendingStaked)}
              </span>
            </p>
          )}

          {/* 進行中の投票 */}
          <BetSection
            title="🟢 進行中の投票（結果待ち）"
            bets={summary.bets.filter((b) => !b.isSettled)}
            emptyText="結果待ちの投票はありません。"
          />

          {/* ポイント獲得履歴（確定済み） */}
          <BetSection
            title="📜 確定済み履歴（ポイント獲得履歴）"
            bets={summary.bets.filter((b) => b.isSettled)}
            emptyText="確定済みの投票はまだありません。"
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "gold";
  big?: boolean;
}) {
  const color =
    tone === "good"
      ? "text-accent"
      : tone === "bad"
        ? "text-red-300"
        : tone === "gold"
          ? "text-gold"
          : "text-foreground";
  return (
    <div className="card p-4">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className={`mt-1 font-extrabold ${color} ${big ? "text-2xl" : "text-lg"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function BetSection({
  title,
  bets,
  emptyText,
}: {
  title: string;
  bets: UserBetView[];
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      {bets.length === 0 ? (
        <p className="card p-6 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="card divide-y divide-border/70">
          {bets.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/matches/${b.matchId}`}
                  className="truncate font-bold hover:text-accent"
                >
                  {b.matchTitle}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <StatusBadge status={b.matchStatus} />
                  <span>
                    「{b.optionLabel}」に {formatPoints(b.amount)}
                  </span>
                </div>
                <div className="mt-0.5 text-[0.7rem] text-muted/80">
                  {formatDateTime(b.createdAt)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {b.isSettled ? (
                  <>
                    <div
                      className={`font-extrabold ${b.isHit ? "text-accent" : "text-muted"}`}
                    >
                      {b.isHit ? `的中 ${formatPoints(b.payout)}` : "はずれ"}
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        (b.net ?? 0) >= 0 ? "text-accent" : "text-red-300"
                      }`}
                    >
                      {formatSignedPoints(b.net ?? 0)}
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
  );
}
