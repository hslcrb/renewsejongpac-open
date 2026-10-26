import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from '@next/env';

// [실행 전 디자인 계약 확인 / Prepare the design contract before serving or building]
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const build = process.argv.includes('--build');
if (build) nextEnv.loadEnvConfig(root, false);
const tasks = [
    ...(build ? [["catalog/snapshot.ts"]] : []),
    ["sync-design-tokens.ts", ...(check ? ["--check"] : [])],
    ["audit-component-system.ts", check ? "--check" : "--write"],
    ["audit-visual-contract.ts"],
    ...(build ? [["clean-build.ts"]] : []),
];
for (const [script, ...args] of tasks) {
    const result = spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { cwd: root, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
