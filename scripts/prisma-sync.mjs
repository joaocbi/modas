/**
 * Applies pending Prisma schema to the database when DATABASE_URL is set.
 * Avoids runtime crashes after schema changes (e.g. new columns) when deploy skips migrations.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
    console.log("[prisma-sync] DATABASE_URL not set; skipping prisma db push (e.g. CI or file-only mode).");
    process.exit(0);
}

console.log("[prisma-sync] Running prisma db push...");
try {
    execSync("npx prisma db push", { stdio: "inherit", env: process.env });
    console.log("[prisma-sync] Schema sync completed.");
} catch {
    console.error("[prisma-sync] prisma db push failed. Fix DATABASE_URL or run db push manually.");
    process.exit(1);
}
