import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 はドライバアダプタ必須。
// ローカル開発は SQLite(better-sqlite3) を使用。
//
// 【本番(Vercel等 / Postgres)へ切り替える場合】
//   1. `npm i @prisma/adapter-pg`
//   2. prisma/schema.prisma の datasource provider を "postgresql" に変更
//   3. 下記を PrismaPg アダプタに差し替え:
//        import { PrismaPg } from "@prisma/adapter-pg";
//        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
//   4. DATABASE_URL を Postgres 接続文字列に設定し `prisma migrate deploy`
const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";

// Next.js のホットリロードで複数インスタンスが生成されるのを防ぐシングルトン
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
