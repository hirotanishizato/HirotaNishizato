"use client";

import { useActionState } from "react";
import { importMatchesCsv, type ImportState } from "@/app/admin/actions";

const initial: ImportState = {};

const SAMPLE = `title,category,description,kickoffAt,options
日本 vs カメルーン,グループD 第1節,予選リーグ初戦,2026-06-15 19:00,日本勝利|引き分け|カメルーン勝利
アルゼンチン vs ブラジル,注目カード,南米対決,2026-06-20 09:00,アルゼンチン勝利|引き分け|ブラジル勝利
日本の初戦スコア,スコア予想,正確なスコアを当てよう,2026-06-15 19:00,日本が2点差以上|日本が1点差|引き分け|カメルーンが勝利`;

export function ImportForm() {
  const [state, action, pending] = useActionState(importMatchesCsv, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="card p-5">
        <label className="label" htmlFor="file">
          CSVファイルをアップロード
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="input"
        />

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          または直接貼り付け
          <span className="h-px flex-1 bg-border" />
        </div>

        <label className="label" htmlFor="text">
          CSVテキスト
        </label>
        <textarea
          id="text"
          name="text"
          className="textarea font-mono text-xs"
          rows={8}
          placeholder={SAMPLE}
        />

        <button type="submit" disabled={pending} className="btn btn-primary mt-4">
          {pending ? "登録中…" : "一括登録する"}
        </button>
      </div>

      {state.message && (
        <div
          className={`card p-4 text-sm font-bold ${
            state.ok ? "border-accent/40 text-accent" : "border-danger/40 text-red-300"
          }`}
        >
          {state.ok ? "✅ " : "⚠️ "}
          {state.message}
        </div>
      )}

      {state.errors && state.errors.length > 0 && (
        <div className="card border-amber-400/40 p-4">
          <div className="text-sm font-bold text-amber-300">
            スキップした行（{state.errors.length}件）
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {state.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
