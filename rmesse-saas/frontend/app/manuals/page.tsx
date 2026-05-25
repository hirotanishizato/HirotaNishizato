'use client';

import { useEffect, useState } from 'react';
import { api, Manual, Shop } from '@/lib/api';
import { ShopPicker } from '@/components/ShopPicker';

export default function ManualsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [items, setItems] = useState<Manual[]>([]);
  const [form, setForm] = useState({ title: '', content: '', product_ids: '' });

  const refresh = async () => {
    if (shopId == null) return;
    const r = await api.get<Manual[]>(`/manuals?shop_id=${shopId}`);
    setItems(r);
  };

  useEffect(() => { refresh(); }, [shopId]);

  const handleCreate = async () => {
    if (!shopId || !form.title || !form.content) return;
    await api.post('/manuals', {
      shop_id: shopId,
      title: form.title,
      content: form.content,
      applies_to_product_external_ids: form.product_ids
        ? form.product_ids.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
    });
    setForm({ title: '', content: '', product_ids: '' });
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await api.del(`/manuals/${id}`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マニュアル管理</h1>
        <ShopPicker shopId={shopId} setShopId={setShopId} shops={shops} setShops={setShops} />
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-bold">新規マニュアル</h2>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="タイトル"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="対象商品ID（カンマ区切り。空欄なら全商品共通）"
          value={form.product_ids}
          onChange={(e) => setForm({ ...form, product_ids: e.target.value })}
        />
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={6}
          placeholder="商品ページに無い補足情報"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          追加
        </button>
      </div>

      <div className="bg-white border rounded-lg">
        {items.map((m) => (
          <div key={m.id} className="border-b last:border-0 p-4">
            <div className="flex justify-between">
              <div className="font-bold">{m.title}</div>
              <button onClick={() => handleDelete(m.id)} className="text-red-600 text-sm">削除</button>
            </div>
            {m.applies_to_product_external_ids && (
              <div className="text-xs text-gray-500">対象: {m.applies_to_product_external_ids.join(', ')}</div>
            )}
            <pre className="text-sm whitespace-pre-wrap mt-2">{m.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
