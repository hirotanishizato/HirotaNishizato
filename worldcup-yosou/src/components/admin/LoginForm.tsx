"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);
  return (
    <form action={action} className="card p-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">
          管理パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder="パスワード"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-bold text-red-300">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "確認中…" : "ログイン"}
      </button>
      <p className="text-xs text-muted">
        パスワードは環境変数 <code className="text-foreground/80">ADMIN_PASSWORD</code>{" "}
        で設定します（未設定時の仮パスワードは <code>admin2026</code>）。
      </p>
    </form>
  );
}
