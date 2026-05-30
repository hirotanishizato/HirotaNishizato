// ─────────────────────────────────────────────────────────────
// 擬似ベッティングの中核ロジック（パリミュチュエル方式）
//
//   ・その試合に賭けられた総ポイント(totalPool)を、的中者へ
//     各自の賭け金の比率で按分して還元する。
//   ・あるオプションのオッズ(配当倍率) = totalPool / そのオプションの賭け金合計
//   ・的中者の受取総額 payout = amount * (totalPool / winningPool)
//     （= amount * オッズ）。損益 net = payout - amount。
//   ・外れた賭けは payout = 0（= -amount の損益）。
//   ・的中者が居ない / 勝ち選択肢が未設定の場合は全額返金(payout=amount)。
//
//   ※ 本サイトは現実の金銭を賭けるものではなく、架空ポイントの遊びです。
// ─────────────────────────────────────────────────────────────

import { MATCH_STATUS, type MatchStatus } from "./constants";

export interface BetLike {
  id: string;
  optionId: string;
  amount: number;
}

export interface OptionLike {
  id: string;
  label: string;
  sortOrder: number;
  isWinner: boolean;
}

export interface OptionPool {
  optionId: string;
  label: string;
  sortOrder: number;
  isWinner: boolean;
  pool: number; // このオプションへの総投票額
  betCount: number; // 投票件数
  odds: number | null; // 配当倍率（賭けが無ければ null）
  share: number; // プール全体に占める割合(0〜1)
}

export interface MatchPools {
  totalPool: number;
  totalBets: number;
  options: OptionPool[];
}

/** オプションごとのプール・オッズを算出 */
export function computePools(
  options: OptionLike[],
  bets: BetLike[],
): MatchPools {
  const poolByOption = new Map<string, { pool: number; count: number }>();
  for (const o of options) poolByOption.set(o.id, { pool: 0, count: 0 });

  let totalPool = 0;
  for (const b of bets) {
    const entry = poolByOption.get(b.optionId);
    if (!entry) continue; // 念のため（孤立した賭けは無視）
    entry.pool += b.amount;
    entry.count += 1;
    totalPool += b.amount;
  }

  const optionPools: OptionPool[] = options
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => {
      const entry = poolByOption.get(o.id) ?? { pool: 0, count: 0 };
      const odds = entry.pool > 0 ? totalPool / entry.pool : null;
      const share = totalPool > 0 ? entry.pool / totalPool : 0;
      return {
        optionId: o.id,
        label: o.label,
        sortOrder: o.sortOrder,
        isWinner: o.isWinner,
        pool: entry.pool,
        betCount: entry.count,
        odds,
        share,
      };
    });

  return {
    totalPool,
    totalBets: bets.length,
    options: optionPools,
  };
}

export interface SettlementResult {
  betId: string;
  payout: number;
  isHit: boolean;
}

/**
 * 結果確定時の各賭けの還元額を計算する。
 * @param bets        対象試合の全ベット
 * @param winnerOptionIds 勝ち選択肢のID集合
 */
export function computeSettlement(
  bets: BetLike[],
  winnerOptionIds: Set<string>,
): SettlementResult[] {
  const totalPool = bets.reduce((s, b) => s + b.amount, 0);
  const winningPool = bets
    .filter((b) => winnerOptionIds.has(b.optionId))
    .reduce((s, b) => s + b.amount, 0);

  // 的中者が居ない（または勝ち選択肢未設定）→ 全額返金
  const refundAll = winningPool <= 0;

  return bets.map((b) => {
    if (refundAll) {
      return { betId: b.id, payout: b.amount, isHit: false };
    }
    const hit = winnerOptionIds.has(b.optionId);
    return {
      betId: b.id,
      payout: hit ? Math.round((b.amount * totalPool) / winningPool) : 0,
      isHit: hit,
    };
  });
}

/**
 * 保存ステータスと現在時刻から「実効ステータス」を求める。
 * 締切時刻を過ぎたら自動的に CLOSED 扱いにする（cron不要）。
 */
export function effectiveStatus(
  match: { status: string; kickoffAt: Date | string },
  now: Date = new Date(),
): MatchStatus {
  if (match.status === MATCH_STATUS.SETTLED) return MATCH_STATUS.SETTLED;
  const kickoff = new Date(match.kickoffAt).getTime();
  if (now.getTime() >= kickoff) return MATCH_STATUS.CLOSED;
  return MATCH_STATUS.OPEN;
}

/** 投票受付中か（締切前 かつ 未確定） */
export function isBettingOpen(
  match: { status: string; kickoffAt: Date | string },
  now: Date = new Date(),
): boolean {
  return effectiveStatus(match, now) === MATCH_STATUS.OPEN;
}
