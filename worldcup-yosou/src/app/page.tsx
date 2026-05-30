import Link from "next/link";
import { getMatchSummaries } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = await getMatchSummaries();
  const open = matches.filter((m) => m.status === "OPEN");
  const closed = matches.filter((m) => m.status === "CLOSED");
  const settled = matches.filter((m) => m.status === "SETTLED");

  const totalPool = matches.reduce((s, m) => s + m.totalPool, 0);
  const totalBets = matches.reduce((s, m) => s + m.totalBets, 0);

  return (
    <div className="space-y-8">
      {/* ヒーロー */}
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-accent/15 via-transparent to-sky-500/10 p-6 sm:p-8">
          <p className="text-xs font-bold tracking-widest text-accent">
            FIFA WORLD CUP 2026 — PREDICTION BATTLE
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
            みんなで予想して、的中で
            <span className="text-gold">ポイント山分け</span>。
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            ワールドカップ2026の試合をテーマに、「誰が勝つか」「何点差か」を予想して投票。
            的中者はその試合の総プールを賭け金に応じて山分けします。所持金の制限はありません。
            <span className="font-bold text-foreground/90">
              現実の金銭は一切賭けない無料の予想ゲーム
            </span>
            です。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="#open" className="btn btn-primary">
              受付中の試合を見る
            </Link>
            <Link href="/mypage" className="btn btn-ghost">
              マイページ
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-muted">
              開催中の試合{" "}
              <span className="font-extrabold text-foreground">{open.length}</span>
            </span>
            <span className="text-muted">
              累計投票{" "}
              <span className="font-extrabold text-foreground">{totalBets}</span> 票
            </span>
            <span className="text-muted">
              総プール{" "}
              <span className="font-extrabold text-gold">
                {formatPoints(totalPool)}
              </span>
            </span>
          </div>
        </div>
      </section>

      {matches.length === 0 && (
        <div className="card p-8 text-center text-muted">
          まだ試合が登録されていません。
          <Link href="/admin" className="ml-1 font-bold text-accent">
            管理画面
          </Link>
          から試合を登録してください。
        </div>
      )}

      <Section id="open" title="🟢 受付中の試合" matches={open} emptyText="現在、受付中の試合はありません。" />
      <Section title="🟡 締切済み（結果待ち）" matches={closed} emptyText="" hideWhenEmpty />
      <Section title="🔵 結果確定済み" matches={settled} emptyText="" hideWhenEmpty />
    </div>
  );
}

function Section({
  id,
  title,
  matches,
  emptyText,
  hideWhenEmpty,
}: {
  id?: string;
  title: string;
  matches: Awaited<ReturnType<typeof getMatchSummaries>>;
  emptyText: string;
  hideWhenEmpty?: boolean;
}) {
  if (hideWhenEmpty && matches.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      {matches.length === 0 ? (
        <p className="card p-6 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
