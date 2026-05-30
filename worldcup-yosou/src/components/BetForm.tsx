"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeBet } from "@/app/actions";
import { NameField } from "./NameField";
import { USERNAME_STORAGE_KEY } from "@/lib/constants";
import { formatOdds, formatPoints } from "@/lib/format";

export interface BetFormOption {
  id: string;
  label: string;
  odds: number | null;
}

interface Props {
  matchId: string;
  options: BetFormOption[];
  names: string[];
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export function BetForm({ matchId, options, names }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [optionId, setOptionId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 一度入力した名前を Web キャッシュ(localStorage)から復元
  useEffect(() => {
    try {
      const cached = localStorage.getItem(USERNAME_STORAGE_KEY);
      // マウント後にブラウザのキャッシュから名前を復元（SSRでは不可のため）。
      // 初回1回のみのクライアント初期化なので set-state-in-effect を許容。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (cached) setName(cached);
    } catch {
      /* localStorage 不可環境は無視 */
    }
  }, []);

  const amountNum = Math.floor(Number(amount));
  const selected = options.find((o) => o.id === optionId);
  const estPayout =
    selected && selected.odds && amountNum > 0
      ? amountNum * selected.odds
      : null;

  function submit() {
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError("名前を入力してください。");
    if (!optionId) return setError("予想（選択肢）を選んでください。");
    if (!Number.isFinite(amountNum) || amountNum < 1) {
      return setError("投票ポイントは1以上で入力してください。");
    }

    startTransition(async () => {
      const res = await placeBet({
        matchId,
        optionId,
        name: name.trim(),
        amount: amountNum,
      });
      if (!res.ok) {
        setError(res.error ?? "投票に失敗しました。");
        return;
      }
      try {
        localStorage.setItem(USERNAME_STORAGE_KEY, name.trim());
      } catch {
        /* noop */
      }
      setSuccess(
        `「${selected?.label}」に ${formatPoints(amountNum)} を投票しました！`,
      );
      setAmount("");
      setOptionId("");
      router.refresh();
    });
  }

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-base font-extrabold">この試合に予想を投票する</h3>
      <p className="mt-1 text-xs text-muted">
        所持金の制限はありません。好きな予想に好きなだけ架空ポイントを投票できます。
      </p>

      {/* 名前 */}
      <div className="mt-4">
        <label className="label" htmlFor="bet-name">
          あなたの名前
        </label>
        <NameField
          id="bet-name"
          value={name}
          onChange={setName}
          names={names}
          placeholder="ニックネーム（初回は入力、次回から▼で選択）"
        />
      </div>

      {/* 選択肢 */}
      <div className="mt-4">
        <span className="label">予想を選ぶ</span>
        <div className="grid gap-2">
          {options.map((o) => {
            const active = o.id === optionId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOptionId(o.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface-2 hover:border-accent/50"
                }`}
              >
                <span className="font-bold">{o.label}</span>
                <span
                  className={`text-sm font-extrabold ${active ? "text-accent" : "text-muted"}`}
                >
                  {formatOdds(o.odds)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 金額 */}
      <div className="mt-4">
        <label className="label" htmlFor="bet-amount">
          投票ポイント
        </label>
        <input
          id="bet-amount"
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="例: 1000"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() =>
                setAmount(String((Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0) + q))
              }
              className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs font-bold text-muted hover:border-accent/50 hover:text-foreground"
            >
              +{q.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount("")}
            className="rounded-lg border border-border bg-transparent px-3 py-1 text-xs font-bold text-muted hover:text-foreground"
          >
            クリア
          </button>
        </div>
      </div>

      {estPayout !== null && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
          現在のオッズで的中した場合の払い戻し目安：{" "}
          <span className="font-extrabold text-gold">
            {formatPoints(estPayout)}
          </span>
          <span className="ml-1 text-xs text-muted">
            （確定オッズは締切時のプールで決まります）
          </span>
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-bold text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-accent">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="btn btn-primary mt-4 w-full text-base"
      >
        {isPending ? "投票中…" : "この予想に投票する"}
      </button>
    </div>
  );
}
