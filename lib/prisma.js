import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis;
const databaseUrl = process.env.DATABASE_URL;

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
