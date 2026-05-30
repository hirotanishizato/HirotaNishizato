import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeSettlement } from "../src/lib/odds";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// JST の "YYYY-MM-DD HH:mm" を Date に
function jst(s: string): Date {
  return new Date(`${s.replace(" ", "T")}:00+09:00`);
}

interface SeedMatch {
  title: string;
  category: string;
  description: string;
  kickoff: string; // JST
  options: string[];
  bets: { name: string; option: number; amount: number }[];
  settleWinners?: number[]; // 的中オプションのindex（指定時は結果確定）
  resultNote?: string;
}

const DATA: SeedMatch[] = [
  {
    title: "日本 vs カメルーン",
    category: "グループD 第1節",
    description: "森保ジャパン、ワールドカップ2026初戦。勝敗を予想しよう！",
    kickoff: "2026-06-15 19:00",
    options: ["日本勝利", "引き分け", "カメルーン勝利"],
    bets: [
      { name: "たかし", option: 0, amount: 5000 },
      { name: "サッカー太郎", option: 0, amount: 3000 },
      { name: "みさき", option: 1, amount: 2000 },
      { name: "ジダン推し", option: 2, amount: 4000 },
      { name: "ゆうと", option: 0, amount: 1000 },
    ],
  },
  {
    title: "アルゼンチン vs ブラジル",
    category: "注目カード",
    description: "南米の頂上決戦。メッシ世代 vs 新生ブラジル。",
    kickoff: "2026-06-20 09:00",
    options: ["アルゼンチン勝利", "引き分け", "ブラジル勝利"],
    bets: [
      { name: "サッカー太郎", option: 0, amount: 8000 },
      { name: "みさき", option: 2, amount: 6000 },
      { name: "ジダン推し", option: 2, amount: 5000 },
      { name: "ゆうと", option: 1, amount: 1500 },
    ],
  },
  {
    title: "日本の初戦スコア予想",
    category: "スコア予想",
    description: "日本 vs カメルーンの正確なスコアを当てよう（点差テーマ）。",
    kickoff: "2026-06-15 19:00",
    options: [
      "日本が2点差以上で勝利",
      "日本が1点差で勝利",
      "引き分け",
      "カメルーンが勝利",
    ],
    bets: [
      { name: "たかし", option: 1, amount: 3000 },
      { name: "ゆうと", option: 0, amount: 2000 },
      { name: "みさき", option: 2, amount: 1000 },
    ],
  },
  {
    title: "【親善試合】日本 vs ペルー",
    category: "強化試合",
    description: "本大会前の最終調整マッチ。※すでにキックオフ済み・結果待ち。",
    kickoff: "2026-05-28 19:30",
    options: ["日本勝利", "引き分け", "ペルー勝利"],
    bets: [
      { name: "たかし", option: 0, amount: 2000 },
      { name: "サッカー太郎", option: 1, amount: 1000 },
      { name: "みさき", option: 0, amount: 1500 },
    ],
  },
  {
    title: "【親善試合】日本 vs チュニジア",
    category: "強化試合",
    description: "結果確定済みのサンプル試合。日本が2-0で勝利しました。",
    kickoff: "2026-05-20 19:30",
    options: ["日本勝利", "引き分け", "チュニジア勝利"],
    bets: [
      { name: "たかし", option: 0, amount: 4000 },
      { name: "サッカー太郎", option: 0, amount: 2000 },
      { name: "みさき", option: 1, amount: 3000 },
      { name: "ジダン推し", option: 2, amount: 5000 },
    ],
    settleWinners: [0],
    resultNote: "日本 2-0 チュニジア",
  },
];

async function main() {
  console.log("🌱 既存データを削除中…");
  await prisma.bet.deleteMany();
  await prisma.option.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  for (const m of DATA) {
    const match = await prisma.match.create({
      data: {
        title: m.title,
        category: m.category,
        description: m.description,
        kickoffAt: jst(m.kickoff),
        options: {
          create: m.options.map((label, i) => ({ label, sortOrder: i })),
        },
      },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });

    // 投票登録
    const createdBets: { id: string; optionId: string; amount: number }[] = [];
    for (const b of m.bets) {
      const user = await prisma.user.upsert({
        where: { name: b.name },
        create: { name: b.name },
        update: {},
      });
      const option = match.options[b.option];
      const bet = await prisma.bet.create({
        data: {
          matchId: match.id,
          optionId: option.id,
          userId: user.id,
          userName: b.name,
          amount: b.amount,
        },
      });
      createdBets.push({ id: bet.id, optionId: option.id, amount: b.amount });
    }

    // 結果確定（指定があれば）
    if (m.settleWinners && m.settleWinners.length > 0) {
      const winnerIds = new Set(
        m.settleWinners.map((i) => match.options[i].id),
      );
      const settlements = computeSettlement(createdBets, winnerIds);
      for (const opt of match.options) {
        await prisma.option.update({
          where: { id: opt.id },
          data: { isWinner: winnerIds.has(opt.id) },
        });
      }
      for (const s of settlements) {
        await prisma.bet.update({
          where: { id: s.betId },
          data: { payout: s.payout, isHit: s.isHit, isSettled: true },
        });
      }
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "SETTLED",
          settledAt: new Date(),
          resultNote: m.resultNote ?? "",
        },
      });
    }

    console.log(`  ✅ ${m.title}（${m.bets.length}票）`);
  }

  const counts = {
    matches: await prisma.match.count(),
    options: await prisma.option.count(),
    bets: await prisma.bet.count(),
    users: await prisma.user.count(),
  };
  console.log("🌱 完了:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
