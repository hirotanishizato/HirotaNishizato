'use client';

import { useEffect, useState } from 'react';
import { api, AuditLogEntry, UsageSummary } from '@/lib/api';

const ACTION_LABELS: Record<string, string> = {
  'auth.signup': '新規登録',
  'auth.login': 'ログイン',
  'draft.generate': '下書き生成',
  'draft.send': '下書き送信',
  'shop.update_credentials': 'RMS資格情報更新',
};

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  useEffect(() => {
    api.get<UsageSummary>(`/usage/ai-summary?period=${period}`).then(setSummary);
    api.get<AuditLogEntry[]>('/usage/audit-logs?limit=100').then(setLogs);
  }, [period]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">利用状況</h1>

      <section className="bg-white border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">AI利用量</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'month' | 'all')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="month">過去30日</option>
            <option value="all">累計</option>
          </select>
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">リクエスト数</div>
              <div className="text-2xl font-bold">{summary.total_requests}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">入力トークン</div>
              <div className="text-2xl font-bold">{summary.total_tokens_in.toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">出力トークン</div>
              <div className="text-2xl font-bold">{summary.total_tokens_out.toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">合計トークン</div>
              <div className="text-2xl font-bold">{summary.total_tokens.toLocaleString()}</div>
            </div>
          </div>
        )}
        {summary && Object.keys(summary.by_provider).length > 0 && (
          <div className="text-sm">
            プロバイダ別:{' '}
            {Object.entries(summary.by_provider).map(([p, v]) => (
              <span key={p} className="inline-block mr-3">
                <strong>{p}</strong>: {v.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-bold">操作履歴 (最新100件)</h2>
        <div className="text-sm">
          <table className="w-full">
            <thead className="text-xs text-gray-500 text-left">
              <tr>
                <th className="py-1">日時</th>
                <th>操作</th>
                <th>対象</th>
                <th>結果</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-1 text-gray-600">{new Date(l.created_at).toLocaleString('ja-JP')}</td>
                  <td>{ACTION_LABELS[l.action] || l.action}</td>
                  <td className="text-gray-500">
                    {l.target_type ? `${l.target_type}#${l.target_id}` : '-'}
                  </td>
                  <td>
                    {l.success ? (
                      <span className="text-green-600">成功</span>
                    ) : (
                      <span className="text-red-600">失敗</span>
                    )}
                  </td>
                  <td className="text-gray-400 text-xs">{l.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="text-gray-500 py-4">まだ操作履歴がありません。</div>}
        </div>
      </section>
    </div>
  );
}
