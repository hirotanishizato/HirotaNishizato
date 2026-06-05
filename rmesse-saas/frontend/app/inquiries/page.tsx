'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Inquiry, Shop } from '@/lib/api';

const STATUS_COLORS: Record<Inquiry['status'], string> = {
  new: 'bg-blue-100 text-blue-800',
  drafted: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
  needs_human: 'bg-red-100 text-red-800',
};

export default function InquiriesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.get<Shop[]>('/shops').then((s) => {
      setShops(s);
      if (s[0]) setShopId(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (shopId == null) return;
    setLoading(true);
    api
      .get<Inquiry[]>(`/inquiries?shop_id=${shopId}`)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [shopId]);

  const handleSync = async () => {
    if (shopId == null) return;
    setSyncing(true);
    try {
      await api.post(`/shops/${shopId}/sync-inquiries`);
      const newItems = await api.get<Inquiry[]>(`/inquiries?shop_id=${shopId}`);
      setItems(newItems);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問い合わせ一覧</h1>
        <div className="flex items-center gap-2">
          <select
            value={shopId ?? ''}
            onChange={(e) => setShopId(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={syncing || shopId == null}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? '取得中...' : 'RMSから取得'}
          </button>
        </div>
      </div>

      {loading ? (
        <div>読み込み中...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          まだ問い合わせがありません。「RMSから取得」を押してください。
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {items.map((i) => (
            <Link
              key={i.id}
              href={`/inquiries/${i.id}`}
              className="block border-b last:border-0 p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">{i.subject || '(件名なし)'}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[i.status]}`}>
                  {i.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 truncate">{i.body}</div>
              <div className="text-xs text-gray-400 mt-1">
                {i.customer_name || '匿名'} · {i.received_at || i.created_at}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
