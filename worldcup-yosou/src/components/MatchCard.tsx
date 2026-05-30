import Link from "next/link";
import type { MatchSummary } from "@/lib/queries";
import { formatDateTime, formatOdds, formatPoints } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { Countdown } from "./Countdown";

export function MatchCard({ match }: { match: MatchSummary }) {
  const topOptions = match.options.slice(0, 4);
  return (
    <Link
      href={`/matches/${match.id}`}
      className="card block p-4 transition hover:border-accent/50 hover:bg-surface-2/60"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={match.status} />
          {match.category && (
            <span className="badge border border-border bg-surface-2 text-muted">
              {match.category}
            </span>
          )}
        </div>
        <Countdown
          kickoffIso={match.kickoffAt.toISOString()}
          settled={match.status === "SETTLED"}
        />
      </div>

      <h3 className="mt-3 text-lg font-extrabold leading-snug">{match.title}</h3>
      <p className="mt-1 text-xs text-muted">
        🗓 {formatDateTime(match.kickoffAt)} 開始（＝投票締切）
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {topOptions.map((o) => (
          <span
            key={o.optionId}
            className={`badge border ${
              match.status === "SETTLED" && o.isWinner
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-border bg-surface-2 text-foreground/90"
            }`}
          >
            {o.label}
            <span className="ml-1 text-gold/90">{formatOdds(o.odds)}</span>
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          総プール{" "}
          <span className="font-bold text-foreground">
            {formatPoints(match.totalPool)}
          </span>
          ・{match.totalBets}票
        </span>
        {match.status === "SETTLED" && match.winnerLabels.length > 0 ? (
          <span className="font-bold text-gold">
            🏆 {match.winnerLabels.join(" / ")}
          </span>
        ) : (
          <span className="font-bold text-accent">詳細・投票 →</span>
        )}
      </div>
    </Link>
  );
}
