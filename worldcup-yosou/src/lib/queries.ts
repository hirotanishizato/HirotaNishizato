import "server-only";
import { prisma } from "./prisma";
import {
  computePools,
  effectiveStatus,
  type MatchPools,
  type OptionPool,
} from "./odds";
import type { MatchStatus } from "./constants";

// ── ホーム/一覧用 ─────────────────────────────────────────────
export interface MatchSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  kickoffAt: Date;
  status: MatchStatus; // 実効ステータス
  resultNote: string;
  totalPool: number;
  totalBets: number;
  options: OptionPool[];
  winnerLabels: string[];
}

function toSummary(match: {
  id: string;
  title: string;
  category: string;
  description: string;
  kickoffAt: Date;
  status: string;
  resultNote: string;
  options: { id: string; label: string; sortOrder: number; isWinner: boolean }[];
  bets: { id: string; optionId: string; amount: number }[];
}): MatchSummary {
  const pools = computePools(match.options, match.bets);
  return {
    id: match.id,
    title: match.title,
    category: match.category,
    description: match.description,
    kickoffAt: match.kickoffAt,
    status: effectiveStatus(match),
    resultNote: match.resultNote,
    totalPool: pools.totalPool,
    totalBets: pools.totalBets,
    options: pools.options,
    winnerLabels: match.options
      .filter((o) => o.isWinner)
      .map((o) => o.label),
  };
}

export async function getMatchSummaries(): Promise<MatchSummary[]> {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: {
      options: true,
      bets: { select: { id: true, optionId: true, amount: true } },
    },
  });
  return matches.map(toSummary);
}

// ── 試合詳細用 ─────────────────────────────────────────────────
export interface BetView {
  id: string;
  userName: string;
  optionId: string;
  optionLabel: string;
  amount: number;
  createdAt: Date;
  isSettled: boolean;
  isHit: boolean;
  payout: number;
}

export interface MatchDetail extends MatchSummary {
  pools: MatchPools;
  bets: BetView[];
}

export async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      bets: {
        orderBy: { createdAt: "desc" },
        include: { option: true },
      },
    },
  });
  if (!match) return null;

  const pools = computePools(
    match.options,
    match.bets.map((b) => ({ id: b.id, optionId: b.optionId, amount: b.amount })),
  );

  const summary = toSummary({
    ...match,
    bets: match.bets.map((b) => ({
      id: b.id,
      optionId: b.optionId,
      amount: b.amount,
    })),
  });

  const bets: BetView[] = match.bets.map((b) => ({
    id: b.id,
    userName: b.userName,
    optionId: b.optionId,
    optionLabel: b.option.label,
    amount: b.amount,
    createdAt: b.createdAt,
    isSettled: b.isSettled,
    isHit: b.isHit,
    payout: b.payout,
  }));

  return { ...summary, pools, bets };
}

// ── 名前一覧（フロントのプルダウン用） ───────────────────────────
export async function getUserNames(): Promise<string[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return users.map((u) => u.name);
}

// ── 管理: ユーザー一覧 ────────────────────────────────────────
export interface UserOverview {
  id: string;
  name: string;
  betCount: number;
  totalStaked: number;
  netSettled: number;
  hitCount: number;
  settledCount: number;
  lastBetAt: Date | null;
  createdAt: Date;
}

export async function getUsersOverview(): Promise<UserOverview[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      bets: {
        select: {
          amount: true,
          payout: true,
          isSettled: true,
          isHit: true,
          createdAt: true,
        },
      },
    },
  });

  return users.map((u) => {
    let totalStaked = 0;
    let netSettled = 0;
    let hitCount = 0;
    let settledCount = 0;
    let lastBetAt: Date | null = null;
    for (const b of u.bets) {
      totalStaked += b.amount;
      if (b.isSettled) {
        netSettled += b.payout - b.amount;
        settledCount += 1;
        if (b.isHit) hitCount += 1;
      }
      if (!lastBetAt || b.createdAt > lastBetAt) lastBetAt = b.createdAt;
    }
    return {
      id: u.id,
      name: u.name,
      betCount: u.bets.length,
      totalStaked,
      netSettled,
      hitCount,
      settledCount,
      lastBetAt,
      createdAt: u.createdAt,
    };
  });
}

// ── マイページ用サマリー ──────────────────────────────────────
export interface UserBetView {
  id: string;
  matchId: string;
  matchTitle: string;
  optionLabel: string;
  amount: number;
  createdAt: Date;
  matchStatus: MatchStatus;
  isSettled: boolean;
  isHit: boolean;
  payout: number;
  net: number | null; // 確定済みのみ。未確定は null
}

export interface UserSummary {
  name: string;
  totalStaked: number; // 賭けた総額（全ベット）
  pendingStaked: number; // 未確定で拘束中の額
  settledStaked: number; // 確定済みベットの賭け額
  totalPayout: number; // 確定済みベットの受取総額
  netSettled: number; // 確定済みの損益（totalPayout - settledStaked）
  hitCount: number;
  settledCount: number;
  bets: UserBetView[];
}

export async function getUserSummary(name: string): Promise<UserSummary | null> {
  const user = await prisma.user.findUnique({
    where: { name },
    include: {
      bets: {
        orderBy: { createdAt: "desc" },
        include: { match: true, option: true },
      },
    },
  });
  if (!user) return null;

  let totalStaked = 0;
  let pendingStaked = 0;
  let settledStaked = 0;
  let totalPayout = 0;
  let hitCount = 0;
  let settledCount = 0;

  const bets: UserBetView[] = user.bets.map((b) => {
    totalStaked += b.amount;
    if (b.isSettled) {
      settledStaked += b.amount;
      totalPayout += b.payout;
      settledCount += 1;
      if (b.isHit) hitCount += 1;
    } else {
      pendingStaked += b.amount;
    }
    return {
      id: b.id,
      matchId: b.matchId,
      matchTitle: b.match.title,
      optionLabel: b.option.label,
      amount: b.amount,
      createdAt: b.createdAt,
      matchStatus: effectiveStatus(b.match),
      isSettled: b.isSettled,
      isHit: b.isHit,
      payout: b.payout,
      net: b.isSettled ? b.payout - b.amount : null,
    };
  });

  return {
    name: user.name,
    totalStaked,
    pendingStaked,
    settledStaked,
    totalPayout,
    netSettled: totalPayout - settledStaked,
    hitCount,
    settledCount,
    bets,
  };
}
