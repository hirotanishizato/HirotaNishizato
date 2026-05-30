"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NameField } from "./NameField";
import { USERNAME_STORAGE_KEY } from "@/lib/constants";

interface Props {
  names: string[];
  currentName: string;
  compact?: boolean;
}

/**
 * マイページの名前選択。
 *  - 名前未指定で開いた場合、localStorage に保存済みの名前があれば自動表示。
 *  - 表示中の名前は localStorage に保存し、次回も保持する。
 */
export function MyPageNamePicker({ names, currentName, compact }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(currentName);
  const restored = useRef(false);

  // 初回マウント時の Web キャッシュ復元 / 保存
  useEffect(() => {
    if (currentName) {
      try {
        localStorage.setItem(USERNAME_STORAGE_KEY, currentName);
      } catch {
        /* noop */
      }
      return;
    }
    if (restored.current) return;
    restored.current = true;
    try {
      const cached = localStorage.getItem(USERNAME_STORAGE_KEY);
      if (cached) {
        router.replace(`/mypage?name=${encodeURIComponent(cached)}`);
      }
    } catch {
      /* noop */
    }
  }, [currentName, router]);

  function go() {
    const name = value.trim();
    if (!name) return;
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, name);
    } catch {
      /* noop */
    }
    router.push(`/mypage?name=${encodeURIComponent(name)}`);
  }

  return (
    <div className={`card p-4 ${compact ? "" : "sm:p-5"}`}>
      <label className="label" htmlFor="mypage-name">
        {compact ? "別の名前で見る" : "名前を入力してマイページを表示"}
      </label>
      <div className="flex gap-2">
        <NameField
          id="mypage-name"
          value={value}
          onChange={setValue}
          names={names}
          placeholder="ニックネーム（▼で過去の名前を選択）"
        />
        <button type="button" onClick={go} className="btn btn-primary shrink-0">
          表示
        </button>
      </div>
      {!compact && (
        <p className="mt-2 text-xs text-muted">
          一度表示した名前はこの端末に記憶され、次回から自動で開きます。
        </p>
      )}
    </div>
  );
}
