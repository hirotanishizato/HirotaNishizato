'use client';

import { useEffect, useState } from 'react';
import { api, Shop, Template } from '@/lib/api';
import { ShopPicker } from '@/components/ShopPicker';

export default function TemplatesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [items, setItems] = useState<Template[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    body: '',
    match_keywords: '',
    priority: 0,
  });

  const refresh = async () => {
    if (shopId == null) return;
    const r = await api.get<Template[]>(`/templates?shop_id=${shopId}`);
    setItems(r);
  };

  useEffect(() => { refresh(); }, [shopId]);

  const handleCreate = async () => {
    if (!shopId || !form.title || !form.body) return;
    await api.post('/templates', {
      shop_id: shopId,
      title: form.title,
      category: form.category || null,
      body: form.body,
      match_keywords: form.match_keywords
        ? form.match_keywords.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      priority: form.priority,
    });
    setForm({ title: '', category: '', body: '', match_keywords: '', priority: 0 });
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await api.del(`/templates/${id}`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テンプレート管理</h1>
        <ShopPicker shopId={shopId} setShopId={setShopId} shops={shops} setShops={setShops} />
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-bold">新規テンプレート</h2>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="タイトル"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="カテゴリ（例: 配送, 返品）"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="マッチキーワード（カンマ区切り）"
          value={form.match_keywords}
          onChange={(e) => setForm({ ...form, match_keywords: e.target.value })}
        />
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={4}
          placeholder="本文"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          追加
        </button>
      </div>

      <div className="bg-white border rounded-lg">
        {items.map((t) => (
          <div key={t.id} className="border-b last:border-0 p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-bold">{t.title} {t.category && <span className="text-xs text-gray-500">[{t.category}]</span>}</div>
                <div className="text-xs text-gray-500">
                  優先度 {t.priority} {t.match_keywords && `/ kw: ${t.match_keywords.join(', ')}`}
                </div>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm">削除</button>
            </div>
            <pre className="text-sm whitespace-pre-wrap mt-2">{t.body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
