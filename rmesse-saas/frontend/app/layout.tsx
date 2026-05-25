import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import LogoutButton from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'R-Messe 問い合わせ管理',
  description: '楽天R-Messe 問い合わせ管理 + AI下書き生成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">R-Messe Inbox</Link>
            <nav className="flex gap-4 text-sm text-gray-600 flex-1">
              <Link href="/inquiries" className="hover:text-black">問い合わせ</Link>
              <Link href="/templates" className="hover:text-black">テンプレート</Link>
              <Link href="/manuals" className="hover:text-black">マニュアル</Link>
              <Link href="/delivery-rules" className="hover:text-black">納期ルール</Link>
              <Link href="/settings" className="hover:text-black">設定</Link>
            </nav>
            <LogoutButton />
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">
          <AuthGate>{children}</AuthGate>
        </main>
      </body>
    </html>
  );
}
