import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis;

function normalizeDatabaseUrl(value) {
    if (!value) {
        return null;
    }

    try {
        const normalizedUrl = new URL(value);
        const sslMode = String(normalizedUrl.searchParams.get("sslmode") || "").toLowerCase();

        if (["prefer", "require", "verify-ca"].includes(sslMode)) {
            normalizedUrl.searchParams.set("sslmode", "verify-full");
            console.log("[Prisma] Normalized DATABASE_URL sslmode.", {
                previousSslMode: sslMode,
                nextSslMode: "verify-full",
            });
        }

        return normalizedUrl.toString();
    } catch (error) {
        console.warn("[Prisma] Failed to normalize DATABASE_URL. Using original value.", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return value;
    }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

function createPrismaClient() {
    if (!databaseUrl) {
        return null;
    }

    const pool = new Pool({
        connectionString: databaseUrl,
    });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: ["error"],
    });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
