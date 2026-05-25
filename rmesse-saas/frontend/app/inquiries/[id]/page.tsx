'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Draft, Inquiry } from '@/lib/api';

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [editBody, setEditBody] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    const [inq, ds] = await Promise.all([
      api.get<Inquiry>(`/inquiries/${id}`),
      api.get<Draft[]>(`/inquiries/${id}/drafts`),
    ]);
    setInquiry(inq);
    setDrafts(ds);
  };

  useEffect(() => {
    if (id) refresh();
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post<Draft>(`/inquiries/${id}/generate-draft`);
      await refresh();
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (d: Draft) => {
    setEditing(d);
    setEditBody(d.body);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    await api.patch(`/drafts/${editing.id}`, { body: editBody });
    setEditing(null);
    await refresh();
  };

  const handleSend = async (d: Draft) => {
    if (!confirm('この内容で楽天R-Messeに返信します。よろしいですか？')) return;
    setSending(true);
    try {
      await api.post(`/drafts/${d.id}/send`);
      await refresh();
    } finally {
      setSending(false);
    }
  };

  if (!inquiry) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-5">
        <h1 className="text-xl font-bold mb-1">{inquiry.subject || '(件名なし)'}</h1>
        <div className="text-sm text-gray-500 mb-3">
          {inquiry.customer_name} ({inquiry.customer_email}) ・ ステータス: {inquiry.status}
        </div>
        <div className="text-sm space-y-1 mb-3">
          {inquiry.product_external_id && (
            <div>商品ID: <span className="font-mono">{inquiry.product_external_id}</span></div>
          )}
          {inquiry.order_external_id && (
            <div>注文ID: <span className="font-mono">{inquiry.order_external_id}</span></div>
          )}
        </div>
        <div className="whitespace-pre-wrap text-gray-800 border-t pt-3">{inquiry.body}</div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold">AI下書き</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {generating ? '生成中...' : '下書きを生成'}
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
          まだ下書きがありません。
        </div>
      ) : (
        drafts.map((d) => (
          <div key={d.id} className="bg-white rounded-lg border p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                #{d.id} · {d.ai_provider}/{d.ai_model} · {d.status}
              </div>
              <div>{d.created_at}</div>
            </div>

            {editing?.id === d.id ? (
              <>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={12}
                  className="w-full border rounded p-2 text-sm font-mono"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="border px-3 py-1 rounded text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50">
                  {d.body}
                </div>
                {d.sources && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">参照ソース</summary>
                    <pre className="mt-1">{JSON.stringify(d.sources, null, 2)}</pre>
                  </details>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(d)}
                    disabled={d.status === 'sent'}
                    className="border px-3 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleSend(d)}
                    disabled={sending || d.status === 'sent'}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {d.status === 'sent' ? '送信済み' : '送信'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
