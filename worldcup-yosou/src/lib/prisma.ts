import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 はドライバアダプタ必須。DB は PostgreSQL。
// DATABASE_URL は接続文字列（例: postgresql://user:pass@host:5432/db?sslmode=require）。
const DATABASE_URL = process.env.DATABASE_URL;

// Next.js のホットリロードで複数インスタンスが生成されるのを防ぐシングルトン
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
