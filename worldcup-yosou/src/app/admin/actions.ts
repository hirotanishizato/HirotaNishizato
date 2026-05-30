"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  verifyPassword,
  setAdminSession,
  clearAdminSession,
} from "@/lib/auth";
import { computeSettlement } from "@/lib/odds";
import { parseKickoff, parseMatchesCsv } from "@/lib/csv";
import { MATCH_STATUS } from "@/lib/constants";

// 全ページのデータを再検証する簡易ヘルパー
function revalidateAll(matchId?: string) {
  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/import");
  if (matchId) {
    revalidatePath(`/matches/${matchId}`);
    revalidatePath(`/admin/matches/${matchId}`);
  }
}

function parseOptionLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ── ログイン / ログアウト ─────────────────────────────────────
export interface LoginState {
  error?: string;
}

export async function loginAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    return { error: "パスワードが正しくありません。" };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

// ── 試合の新規登録（個別入力） ─────────────────────────────────
export async function createMatch(formData: FormData): Promise<void> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const kickoffRaw = String(formData.get("kickoffAt") ?? "").trim();
  const options = parseOptionLines(String(formData.get("options") ?? ""));

  if (!title) throw new Error("タイトルは必須です。");
  const kickoffAt = parseKickoff(kickoffRaw);
  if (!kickoffAt) throw new Error("試合開始/締切時刻が不正です。");
  if (options.length < 2) throw new Error("選択肢は2つ以上必要です。");

  const match = await prisma.match.create({
    data: {
      title,
      category,
      description,
      kickoffAt,
      options: {
        create: options.map((label, i) => ({ label, sortOrder: i })),
      },
    },
  });

  revalidateAll(match.id);
  redirect(`/admin/matches/${match.id}`);
}

// ── 試合の編集 ────────────────────────────────────────────────
export async function updateMatch(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const kickoffRaw = String(formData.get("kickoffAt") ?? "").trim();
  const optionsText = String(formData.get("options") ?? "");

  if (!title) throw new Error("タイトルは必須です。");
  const kickoffAt = parseKickoff(kickoffRaw);
  if (!kickoffAt) throw new Error("試合開始/締切時刻が不正です。");

  const match = await prisma.match.findUnique({
    where: { id },
    include: { _count: { select: { bets: true } } },
  });
  if (!match) throw new Error("試合が見つかりません。");

  await prisma.match.update({
    where: { id },
    data: { title, category, description, kickoffAt },
  });

  // 投票がまだ無い試合のみ、選択肢を作り直せる（既存投票の保護のため）
  if (match._count.bets === 0) {
    const options = parseOptionLines(optionsText);
    if (options.length >= 2) {
      await prisma.option.deleteMany({ where: { matchId: id } });
      await prisma.option.createMany({
        data: options.map((label, i) => ({ matchId: id, label, sortOrder: i })),
      });
    }
  }

  revalidateAll(id);
  redirect(`/admin/matches/${id}`);
}

// ── 結果確定 ──────────────────────────────────────────────────
export async function settleMatch(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const resultNote = String(formData.get("resultNote") ?? "").trim();
  const winnerIds = formData
    .getAll("winner")
    .map((v) => String(v))
    .filter(Boolean);

  const match = await prisma.match.findUnique({
    where: { id },
    include: { options: true, bets: true },
  });
  if (!match) throw new Error("試合が見つかりません。");

  const winnerSet = new Set(winnerIds);
  const settlements = computeSettlement(
    match.bets.map((b) => ({ id: b.id, optionId: b.optionId, amount: b.amount })),
    winnerSet,
  );

  await prisma.$transaction([
    // 勝ち選択肢のフラグ更新
    ...match.options.map((o) =>
      prisma.option.update({
        where: { id: o.id },
        data: { isWinner: winnerSet.has(o.id) },
      }),
    ),
    // 各ベットの還元額を反映
    ...settlements.map((s) =>
      prisma.bet.update({
        where: { id: s.betId },
        data: { payout: s.payout, isHit: s.isHit, isSettled: true },
      }),
    ),
    // 試合を確定状態に
    prisma.match.update({
      where: { id },
      data: {
        status: MATCH_STATUS.SETTLED,
        settledAt: new Date(),
        resultNote,
      },
    }),
  ]);

  revalidateAll(id);
  redirect(`/admin/matches/${id}`);
}

// ── 結果確定の取り消し（再オープン） ───────────────────────────
export async function reopenMatch(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await prisma.$transaction([
    prisma.option.updateMany({
      where: { matchId: id },
      data: { isWinner: false },
    }),
    prisma.bet.updateMany({
      where: { matchId: id },
      data: { payout: 0, isHit: false, isSettled: false },
    }),
    prisma.match.update({
      where: { id },
      data: { status: MATCH_STATUS.OPEN, settledAt: null, resultNote: "" },
    }),
  ]);

  revalidateAll(id);
  redirect(`/admin/matches/${id}`);
}

// ── 削除系 ────────────────────────────────────────────────────
export async function deleteMatch(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.match.delete({ where: { id } });
  revalidateAll();
  redirect("/admin");
}

export async function deleteBet(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  await prisma.bet.delete({ where: { id } });
  revalidateAll(matchId || undefined);
}

export async function deleteUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.user.delete({ where: { id } });
  revalidateAll();
  redirect("/admin/users");
}

// ── CSV 一括登録 ──────────────────────────────────────────────
export interface ImportState {
  ok?: boolean;
  created?: number;
  errors?: string[];
  message?: string;
}

export async function importMatchesCsv(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();

  const file = formData.get("file");
  let text = String(formData.get("text") ?? "");
  if (file instanceof File && file.size > 0) {
    text = await file.text();
  }
  if (!text.trim()) {
    return { ok: false, message: "CSVが空です。ファイルかテキストを入力してください。" };
  }

  const { rows, errors } = parseMatchesCsv(text);
  if (rows.length === 0) {
    return { ok: false, errors, message: "登録できる行がありませんでした。" };
  }

  for (const row of rows) {
    await prisma.match.create({
      data: {
        title: row.title,
        category: row.category,
        description: row.description,
        kickoffAt: row.kickoffAt,
        options: {
          create: row.options.map((label, i) => ({ label, sortOrder: i })),
        },
      },
    });
  }

  revalidateAll();
  return {
    ok: true,
    created: rows.length,
    errors,
    message: `${rows.length}件の試合を登録しました。`,
  };
}
