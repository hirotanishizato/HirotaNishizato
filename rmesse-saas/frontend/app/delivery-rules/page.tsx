'use client';

import { useEffect, useState } from 'react';
import { api, DeliveryRule, Shop } from '@/lib/api';
import { ShopPicker } from '@/components/ShopPicker';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function DeliveryRulesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [items, setItems] = useState<DeliveryRule[]>([]);
  const [form, setForm] = useState({
    name: '',
    cutoff_time: '14:00',
    business_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    ship_within_business_days: 1,
    notes: '',
    arrival_json: '{"関東":"翌日","関西":"翌々日"}',
  });

  const refresh = async () => {
    if (shopId == null) return;
    const r = await api.get<DeliveryRule[]>(`/delivery-rules?shop_id=${shopId}`);
    setItems(r);
  };

  useEffect(() => { refresh(); }, [shopId]);

  const handleCreate = async () => {
    if (!shopId || !form.name) return;
    let arrival: Record<string, string> | null = null;
    try {
      arrival = form.arrival_json.trim() ? JSON.parse(form.arrival_json) : null;
    } catch {
      alert('地域別到着目安のJSONが正しくありません');
      return;
    }
    await api.post('/delivery-rules', {
      shop_id: shopId,
      name: form.name,
      cutoff_time: form.cutoff_time || null,
      business_days: form.business_days,
      ship_within_business_days: form.ship_within_business_days,
      arrival_by_region: arrival,
      notes: form.notes || null,
    });
    setForm({
      ...form,
      name: '',
      notes: '',
    });
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await api.del(`/delivery-rules/${id}`);
    refresh();
  };

  const toggleDay = (d: string) => {
    setForm({
      ...form,
      business_days: form.business_days.includes(d)
        ? form.business_days.filter((x) => x !== d)
        : [...form.business_days, d],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">納期ルール</h1>
        <ShopPicker shopId={shopId} setShopId={setShopId} shops={shops} setShops={setShops} />
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-bold">新規納期ルール</h2>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="ルール名"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="flex gap-2 items-center text-sm">
          <label>カットオフ:</label>
          <input
            type="time"
            className="border rounded px-2 py-1"
            value={form.cutoff_time}
            onChange={(e) => setForm({ ...form, cutoff_time: e.target.value })}
          />
          <label className="ml-4">発送営業日:</label>
          <input
            type="number"
            min={0}
            className="border rounded px-2 py-1 w-20"
            value={form.ship_within_business_days}
            onChange={(e) => setForm({ ...form, ship_within_business_days: Number(e.target.value) })}
          />
        </div>
        <div className="flex gap-2 text-sm">
          <span>営業日:</span>
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`px-2 py-0.5 border rounded ${form.business_days.includes(d) ? 'bg-blue-600 text-white' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm font-mono"
          rows={2}
          placeholder='地域別到着目安 (JSON)'
          value={form.arrival_json}
          onChange={(e) => setForm({ ...form, arrival_json: e.target.value })}
        />
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={2}
          placeholder="補足"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          追加
        </button>
      </div>

      <div className="bg-white border rounded-lg">
        {items.map((r) => (
          <div key={r.id} className="border-b last:border-0 p-4 text-sm">
            <div className="flex justify-between">
              <div className="font-bold">{r.name}</div>
              <button onClick={() => handleDelete(r.id)} className="text-red-600">削除</button>
            </div>
            <div className="text-gray-600">
              カットオフ {r.cutoff_time} / 営業日 {r.business_days?.join(',')} / 発送 {r.ship_within_business_days}日
            </div>
            {r.arrival_by_region && (
              <div className="text-gray-600">到着目安: {JSON.stringify(r.arrival_by_region)}</div>
            )}
            {r.notes && <div className="text-gray-600 mt-1">{r.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
