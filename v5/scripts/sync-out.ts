import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { finalizeReadableExport } from './readable-finalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v5Root = path.resolve(__dirname, "..");
const outDir = path.resolve(v5Root, "out");

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (fs.existsSync(outDir)) {
    const staticDir = path.join(outDir, "_next", "static");
    if (["development", "webpack"].some((name) => fs.existsSync(path.join(staticDir, name)))) {
        throw new Error("Development assets found in the export. Stop the dev server, remove v5/.next and v5/out, then run the production build again.");
    }
    finalizeReadableExport(v5Root);
    console.log("Syncing out/ to v5 root for direct static hosting...");
    const nextDir = path.join(v5Root, "_next");
    if (fs.existsSync(nextDir)) {
        fs.rmSync(nextDir, { recursive: true, force: true });
    }
    copyRecursive(outDir, v5Root);
    console.log("Sync completed successfully!");
}
