import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImportForm } from "@/components/admin/ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div>
      <AdminHeader active="/admin/import" />
      <h1 className="text-2xl font-extrabold">CSVで試合を一括登録</h1>
      <p className="mt-1 text-sm text-muted">
        多数の試合をまとめて登録できます。1行が1試合です。
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <ImportForm />

        <aside className="card h-fit p-5 text-sm">
          <h2 className="text-base font-extrabold">CSVフォーマット</h2>
          <p className="mt-2 text-muted">列の順番（1行目のヘッダーは任意）：</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>
              <code className="text-foreground/90">title</code>：タイトル（必須）
            </li>
            <li>
              <code className="text-foreground/90">category</code>：カテゴリ／大会
            </li>
            <li>
              <code className="text-foreground/90">description</code>：詳細説明
            </li>
            <li>
              <code className="text-foreground/90">kickoffAt</code>：開始＝締切
              <br />
              <span className="text-xs">
                「2026-06-15 19:00」(日本時間) 形式
              </span>
            </li>
            <li>
              <code className="text-foreground/90">options</code>：選択肢を
              <code className="text-foreground/90">|</code>
              で区切り（2つ以上・必須）
            </li>
          </ol>
          <div className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">
            <p className="font-bold text-foreground/90">例</p>
            <pre className="mt-1 whitespace-pre-wrap break-all">
{`日本 vs カメルーン,グループD,初戦,2026-06-15 19:00,日本勝利|引き分け|カメルーン勝利`}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
