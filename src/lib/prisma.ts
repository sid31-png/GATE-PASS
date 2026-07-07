import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The bundler (Turbopack/webpack) rewrites `import.meta.url` inside the generated
// client, which breaks its relative sqlite path resolution. Resolve an absolute
// path from process.cwd() instead so it works the same in dev and production.
const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: `file:${dbPath}` });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
