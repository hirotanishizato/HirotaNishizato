import type { OptionPool } from "@/lib/odds";
import { formatOdds, formatPoints } from "@/lib/format";

interface Props {
  options: OptionPool[];
  totalPool: number;
  settled?: boolean;
}

/** オプションごとのオッズ・投票プール・占有率を表示 */
export function OddsTable({ options, totalPool, settled }: Props) {
  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const pct = Math.round(o.share * 100);
        const isWinner = settled && o.isWinner;
        return (
          <div
            key={o.optionId}
            className={`relative overflow-hidden rounded-xl border px-4 py-3 ${
              isWinner
                ? "border-gold/60 bg-gold/10"
                : "border-border bg-surface-2"
            }`}
          >
            {/* 占有率バー（背景） */}
            <div
              className={`absolute inset-y-0 left-0 ${
                isWinner ? "bg-gold/15" : "bg-accent/10"
              }`}
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold">{o.label}</span>
                  {isWinner && (
                    <span className="badge bg-gold/20 text-gold border border-gold/40">
                      🏆 的中
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {formatPoints(o.pool)}・{o.betCount}票・{pct}%
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-extrabold text-gold">
                  {formatOdds(o.odds)}
                </div>
                <div className="text-[0.65rem] text-muted">オッズ</div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-1 text-right text-xs text-muted">
        この試合の総投票プール:{" "}
        <span className="font-bold text-foreground">
          {formatPoints(totalPool)}
        </span>
      </div>
    </div>
  );
}
