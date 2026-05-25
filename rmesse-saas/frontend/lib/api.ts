const BASE = '/api/v1';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) {
    throw new Error(`API ${r.status}: ${await r.text()}`);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}

export const api = {
  get: <T,>(p: string) => req<T>(p),
  post: <T,>(p: string, body?: unknown) =>
    req<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(p: string, body: unknown) =>
    req<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (p: string) => req<void>(p, { method: 'DELETE' }),
};

export type Inquiry = {
  id: number;
  shop_id: number;
  external_id: string;
  subject: string | null;
  body: string;
  customer_name: string | null;
  customer_email: string | null;
  product_external_id: string | null;
  order_external_id: string | null;
  status: 'new' | 'drafted' | 'replied' | 'closed' | 'needs_human';
  received_at: string | null;
  created_at: string;
};

export type Draft = {
  id: number;
  inquiry_id: number;
  body: string;
  status: 'pending_review' | 'approved' | 'edited' | 'sent' | 'rejected';
  ai_provider: string | null;
  ai_model: string | null;
  sources: Record<string, unknown> | null;
  created_at: string;
};

export type Shop = {
  id: number;
  organization_id: number;
  name: string;
  platform: string;
  shop_code: string | null;
  ai_persona: string | null;
  ai_signature: string | null;
  is_active: boolean;
  has_rms_credentials: boolean;
};

export type Template = {
  id: number;
  shop_id: number;
  title: string;
  category: string | null;
  body: string;
  match_keywords: string[] | null;
  description: string | null;
  is_active: boolean;
  priority: number;
};

export type Manual = {
  id: number;
  shop_id: number;
  title: string;
  content: string;
  applies_to_product_external_ids: string[] | null;
  tags: string[] | null;
  is_active: boolean;
};

export type DeliveryRule = {
  id: number;
  shop_id: number;
  name: string;
  cutoff_time: string | null;
  business_days: string[] | null;
  ship_within_business_days: number;
  arrival_by_region: Record<string, string> | null;
  closed_dates: string[] | null;
  applies_to_product_external_ids: string[] | null;
  notes: string | null;
  is_active: boolean;
  priority: number;
};
