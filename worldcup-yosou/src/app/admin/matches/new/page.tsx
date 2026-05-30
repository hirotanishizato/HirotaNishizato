import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createMatch } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  await requireAdmin();
  return (
    <div>
      <AdminHeader active="/admin/matches/new" />
      <h1 className="text-2xl font-extrabold">試合を追加</h1>
      <p className="mt-1 text-sm text-muted">
        サッカーの試合（予想テーマ）を1件登録します。試合開始時刻がそのまま投票締切になります。
      </p>

      <form action={createMatch} className="card mt-5 max-w-2xl space-y-4 p-5">
        <div>
          <label className="label" htmlFor="title">
            タイトル（必須）
          </label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="例: 日本 vs カメルーン"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              カテゴリ／大会・グループ
            </label>
            <input
              id="category"
              name="category"
              className="input"
              placeholder="例: グループD 第1節"
            />
          </div>
          <div>
            <label className="label" htmlFor="kickoffAt">
              試合開始＝投票締切（日本時間 / 必須）
            </label>
            <input
              id="kickoffAt"
              name="kickoffAt"
              type="datetime-local"
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">
            詳細説明
          </label>
          <textarea
            id="description"
            name="description"
            className="textarea"
            rows={3}
            placeholder="予想テーマの補足や注意事項など"
          />
        </div>

        <div>
          <label className="label" htmlFor="options">
            選択肢（1行に1つ・2つ以上 / 必須）
          </label>
          <textarea
            id="options"
            name="options"
            className="textarea"
            rows={5}
            placeholder={"日本勝利\n引き分け\nカメルーン勝利"}
            required
          />
          <p className="mt-1 text-xs text-muted">
            「日本が2-1で勝利」のように点差まで含めた選択肢も自由に設定できます。
          </p>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            登録する
          </button>
          <Link href="/admin" className="btn btn-ghost">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
