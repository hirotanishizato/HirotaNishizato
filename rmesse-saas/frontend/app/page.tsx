import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-2">R-Messe 問い合わせ管理</h1>
        <p className="text-gray-600">
          楽天R-Messeで受け付けた問い合わせをAIが下書きし、最終チェックして送信できます。
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/inquiries"
          className="block bg-white rounded-lg border p-5 hover:border-blue-500"
        >
          <div className="font-bold mb-1">📥 問い合わせ一覧</div>
          <div className="text-sm text-gray-600">取り込まれた問い合わせ・AI下書きの確認</div>
        </Link>
        <Link
          href="/templates"
          className="block bg-white rounded-lg border p-5 hover:border-blue-500"
        >
          <div className="font-bold mb-1">📝 テンプレート</div>
          <div className="text-sm text-gray-600">独自の回答テンプレートを登録</div>
        </Link>
        <Link
          href="/manuals"
          className="block bg-white rounded-lg border p-5 hover:border-blue-500"
        >
          <div className="font-bold mb-1">📖 マニュアル</div>
          <div className="text-sm text-gray-600">商品/ソフトの補足マニュアル</div>
        </Link>
        <Link
          href="/delivery-rules"
          className="block bg-white rounded-lg border p-5 hover:border-blue-500"
        >
          <div className="font-bold mb-1">🚚 納期ルール</div>
          <div className="text-sm text-gray-600">カットオフ・営業日・地域別到着目安</div>
        </Link>
      </div>
    </div>
  );
}
