/**
 * Commit all changes and push to the current branch (triggers Vercel if Git is connected).
 * Usage: npm run ship -- "your message"
 *        npm run ship   (default timestamp message)
 */
import { execSync } from "node:child_process";

const args = process.argv.slice(2).filter(Boolean);
const message =
    args.join(" ").trim() || `chore: sync ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;

function run(cmd, options = {}) {
    console.log(`[ship] ${cmd}`);
    execSync(cmd, { stdio: "inherit", ...options });
}

function normalizePath(p) {
    return String(p || "").replace(/\\/g, "/").trim();
}

/**
 * Block paths that should never be committed (build output, secrets, vendor trees).
 */
function assertStagedPathsSafe(stagedPaths) {
    const forbidden = [];

    for (const raw of stagedPaths) {
        const p = normalizePath(raw);
        if (!p) {
            continue;
        }

        if (p.endsWith(".env.example") || p.includes(".env.example")) {
            continue;
        }

        if (
            p.startsWith("node_modules/") ||
            p === "node_modules" ||
            p.startsWith(".next/") ||
            p === ".next" ||
            p.startsWith("out/") ||
            p === "out" ||
            p.startsWith(".vercel/") ||
            p === ".vercel"
        ) {
            forbidden.push(p);
            continue;
        }

        const base = p.split("/").pop() || p;
        if (base === ".env" || /\.env\.local$/i.test(base) || /\.env\.production\.local$/i.test(base)) {
            forbidden.push(p);
        }
    }

    if (forbidden.length > 0) {
        console.error("[ship] Refusing to commit unsafe paths (check .gitignore):");
        for (const line of forbidden) {
            console.error(`  - ${line}`);
        }
        try {
            execSync("git reset", { stdio: "inherit" });
        } catch {
            /* ignore */
        }
        process.exit(1);
    }
}

try {
    const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    if (!status) {
        console.log("[ship] Nothing to commit.");
        process.exit(0);
    }

    run("git add -A");

    const staged = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);

    assertStagedPathsSafe(staged);

    run(`git commit -m ${JSON.stringify(message)}`);
    run("git push");
    console.log("[ship] Pushed. If Vercel is linked to this repo, a deploy should start.");
} catch {
    process.exit(1);
}
