'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function LogoutButton() {
  const router = useRouter();
  const handle = () => {
    auth.clear();
    router.push('/login');
  };
  return (
    <button
      onClick={handle}
      className="text-xs text-gray-500 hover:text-black border rounded px-2 py-1"
    >
      ログアウト
    </button>
  );
}
