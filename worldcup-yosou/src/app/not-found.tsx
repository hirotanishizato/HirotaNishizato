import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="text-5xl">⚽</div>
      <h1 className="mt-4 text-2xl font-extrabold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-muted">
        お探しの試合やページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        試合一覧へ戻る
      </Link>
    </div>
  );
}
