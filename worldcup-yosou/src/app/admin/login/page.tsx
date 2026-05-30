import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">管理画面ログイン</h1>
      <p className="text-sm text-muted">
        試合の登録・結果確定・ユーザー管理を行う管理者専用ページです。
      </p>
      <LoginForm />
    </div>
  );
}
