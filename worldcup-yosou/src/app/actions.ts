"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isBettingOpen } from "@/lib/odds";

export interface PlaceBetInput {
  matchId: string;
  optionId: string;
  name: string;
  amount: number;
}

export interface PlaceBetResult {
  ok: boolean;
  error?: string;
}

const MAX_NAME_LENGTH = 30;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000_000; // 架空ポイントの上限（桁あふれ防止）

/**
 * 投票（賭け）を1件登録する。フロントのベットフォームから呼ばれる。
 * 所持金の概念は無く、金額は自由（擬似ベッティング）。
 */
export async function placeBet(input: PlaceBetInput): Promise<PlaceBetResult> {
  const name = (input.name ?? "").trim();
  const amount = Math.floor(Number(input.amount));

  // ── バリデーション ──
  if (!name) return { ok: false, error: "名前を入力してください。" };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `名前は${MAX_NAME_LENGTH}文字以内で入力してください。` };
  }
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return { ok: false, error: "投票ポイントは1以上の整数で入力してください。" };
  }
  if (amount > MAX_AMOUNT) {
    return { ok: false, error: "投票ポイントが大きすぎます。" };
  }

  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: { options: true },
  });
  if (!match) return { ok: false, error: "対象の試合が見つかりません。" };

  const option = match.options.find((o) => o.id === input.optionId);
  if (!option) return { ok: false, error: "選択肢が正しくありません。" };

  if (!isBettingOpen(match)) {
    return {
      ok: false,
      error: "投票は締め切られました（試合開始時刻を過ぎたか結果確定済みです）。",
    };
  }

  // ── 名前ベースのユーザーを作成/取得して投票を登録 ──
  const user = await prisma.user.upsert({
    where: { name },
    create: { name },
    update: {},
  });

  await prisma.bet.create({
    data: {
      matchId: match.id,
      optionId: option.id,
      userId: user.id,
      userName: name,
      amount,
    },
  });

  revalidatePath("/");
  revalidatePath(`/matches/${match.id}`);
  revalidatePath("/mypage");
  revalidatePath("/admin");

  return { ok: true };
}
