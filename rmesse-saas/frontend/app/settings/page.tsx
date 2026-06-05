'use client';

import { useEffect, useState } from 'react';
import { api, Shop } from '@/lib/api';

export default function SettingsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selected, setSelected] = useState<Shop | null>(null);
  const [form, setForm] = useState({
    shop_code: '',
    rms_service_secret: '',
    rms_license_key: '',
    ai_persona: '',
    ai_signature: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Shop[]>('/shops').then((s) => {
      setShops(s);
      if (s[0]) selectShop(s[0]);
    });
  }, []);

  const selectShop = (s: Shop) => {
    setSelected(s);
    setForm({
      shop_code: s.shop_code ?? '',
      rms_service_secret: '',
      rms_license_key: '',
      ai_persona: s.ai_persona ?? '',
      ai_signature: s.ai_signature ?? '',
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        shop_code: form.shop_code || null,
        ai_persona: form.ai_persona || null,
        ai_signature: form.ai_signature || null,
      };
      if (form.rms_service_secret) body.rms_service_secret = form.rms_service_secret;
      if (form.rms_license_key) body.rms_license_key = form.rms_license_key;
      const updated = await api.patch<Shop>(`/shops/${selected.id}`, body);
      setShops(shops.map((s) => (s.id === updated.id ? updated : s)));
      setSelected(updated);
      alert('保存しました');
    } finally {
      setSaving(false);
    }
  };

  if (!selected) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="bg-white border rounded-lg p-4">
        <label className="block text-sm mb-1">ショップ</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selected.id}
          onChange={(e) => selectShop(shops.find((s) => s.id === Number(e.target.value))!)}
        >
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-bold">自動同期</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.auto_sync_enabled}
            onChange={async (e) => {
              const updated = await api.patch<Shop>(`/shops/${selected.id}`, {
                auto_sync_enabled: e.target.checked,
              });
              setShops(shops.map((s) => (s.id === updated.id ? updated : s)));
              setSelected(updated);
            }}
          />
          バックグラウンドで定期的にRMSから問い合わせを取得する
        </label>
        <div className="text-xs text-gray-500">
          最終同期: {selected.last_synced_at ? new Date(selected.last_synced_at).toLocaleString('ja-JP') : '未実行'}
          {selected.last_sync_count !== null && ` / ${selected.last_sync_count}件取得`}
          {selected.last_sync_error && (
            <span className="text-red-600"> / エラー: {selected.last_sync_error}</span>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-bold">RMS 認証情報</h2>
        <div className="text-xs text-gray-500">
          現状: {selected.has_rms_credentials ? '登録済み' : '未登録（モックモード）'}
        </div>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="ショップコード (店舗URLの ID)"
          value={form.shop_code}
          onChange={(e) => setForm({ ...form, shop_code: e.target.value })}
        />
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="serviceSecret"
          value={form.rms_service_secret}
          onChange={(e) => setForm({ ...form, rms_service_secret: e.target.value })}
        />
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="licenseKey"
          value={form.rms_license_key}
          onChange={(e) => setForm({ ...form, rms_license_key: e.target.value })}
        />

        <h2 className="font-bold pt-2">AI返信の個性</h2>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={3}
          placeholder="ペルソナ（例: 丁寧で親しみやすい店長さん）"
          value={form.ai_persona}
          onChange={(e) => setForm({ ...form, ai_persona: e.target.value })}
        />
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={3}
          placeholder="返信末尾の署名"
          value={form.ai_signature}
          onChange={(e) => setForm({ ...form, ai_signature: e.target.value })}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
