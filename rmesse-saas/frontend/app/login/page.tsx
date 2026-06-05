'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    organization_name: '',
    name: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const r = await api.post<{ access_token: string }>(path, body);
      auth.setToken(r.access_token);
      router.push('/');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white border rounded-lg p-6 space-y-4">
      <h1 className="text-xl font-bold">
        {mode === 'login' ? 'ログイン' : '新規登録'}
      </h1>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <input
              required
              className="w-full border rounded px-2 py-2"
              placeholder="会社名 / 組織名"
              value={form.organization_name}
              onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
            />
            <input
              required
              className="w-full border rounded px-2 py-2"
              placeholder="お名前"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </>
        )}
        <input
          required
          type="email"
          className="w-full border rounded px-2 py-2"
          placeholder="メールアドレス"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          className="w-full border rounded px-2 py-2"
          placeholder="パスワード"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {busy ? '送信中...' : mode === 'login' ? 'ログイン' : '登録してはじめる'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="text-sm text-blue-600 hover:underline"
      >
        {mode === 'login'
          ? 'はじめての方は新規登録'
          : 'アカウントをお持ちの方はログイン'}
      </button>
    </div>
  );
}
