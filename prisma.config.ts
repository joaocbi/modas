import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

function loadEnvFile(fileName: string) {
    const filePath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
        return;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");

    for (const line of fileContent.split(/\r?\n/)) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex <= 0) {
            continue;
        }

        const envKey = trimmedLine.slice(0, separatorIndex).trim();
        const envValue = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

        if (envKey && !process.env[envKey]) {
            process.env[envKey] = envValue;
        }
    }
}

loadEnvFile(".env.local");

export default defineConfig({
    schema: "prisma/schema.prisma",
    engine: "classic",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/modas?schema=public",
    },
});
