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

try {
    const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    if (!status) {
        console.log("[ship] Nothing to commit.");
        process.exit(0);
    }

    run("git add -A");
    run(`git commit -m ${JSON.stringify(message)}`);
    run("git push");
    console.log("[ship] Pushed. If Vercel is linked to this repo, a deploy should start.");
} catch {
    process.exit(1);
}
