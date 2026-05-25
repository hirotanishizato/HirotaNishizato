'use client';

import { useEffect } from 'react';
import { api, Shop } from '@/lib/api';

export function ShopPicker({
  shopId,
  setShopId,
  shops,
  setShops,
}: {
  shopId: number | null;
  setShopId: (v: number) => void;
  shops: Shop[];
  setShops: (v: Shop[]) => void;
}) {
  useEffect(() => {
    api.get<Shop[]>('/shops').then((s) => {
      setShops(s);
      if (s[0] && shopId == null) setShopId(s[0].id);
    });
  }, []);

  return (
    <select
      value={shopId ?? ''}
      onChange={(e) => setShopId(Number(e.target.value))}
      className="border rounded px-2 py-1 text-sm"
    >
      {shops.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
