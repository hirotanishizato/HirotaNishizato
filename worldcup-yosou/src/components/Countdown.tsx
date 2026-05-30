"use client";

import { useEffect, useState } from "react";

interface Props {
  /** 締切（試合開始）時刻 ISO文字列 */
  kickoffIso: string;
  settled?: boolean;
  className?: string;
}

function diffParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, total };
}

/**
 * 投票締切までのカウントダウン。「残り◯分」を分単位中心に表示する。
 * 締切1時間以内は警告色＋点滅で煽る。
 */
export function Countdown({ kickoffIso, settled, className }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(kickoffIso).getTime();

  if (settled) {
    return (
      <span className={`badge bg-sky-400/15 text-sky-300 border border-sky-400/30 ${className ?? ""}`}>
        🏁 結果確定
      </span>
    );
  }

  // ハイドレーション前はプレースホルダ
  if (now === null) {
    return (
      <span className={`badge bg-surface-2 text-muted border border-border ${className ?? ""}`}>
        締切まで —
      </span>
    );
  }

  const remaining = target - now;
  if (remaining <= 0) {
    return (
      <span className={`badge bg-amber-400/15 text-amber-300 border border-amber-400/30 ${className ?? ""}`}>
        ⛔ 投票締切
      </span>
    );
  }

  const { days, hours, minutes, seconds } = diffParts(remaining);
  const urgent = remaining <= 60 * 60 * 1000; // 1時間以内
  const veryUrgent = remaining <= 10 * 60 * 1000; // 10分以内

  let text: string;
  if (days > 0) {
    text = `残り ${days}日 ${hours}時間 ${minutes}分`;
  } else if (hours > 0) {
    text = `残り ${hours}時間 ${minutes}分 ${seconds}秒`;
  } else {
    text = `残り ${minutes}分 ${seconds}秒`;
  }

  const tone = urgent
    ? "bg-danger/15 text-red-300 border border-danger/40"
    : "bg-surface-2 text-foreground border border-border";

  return (
    <span
      className={`badge ${tone} ${veryUrgent ? "animate-pulse" : ""} ${className ?? ""}`}
    >
      ⏱ 締切まで {text}
    </span>
  );
}
