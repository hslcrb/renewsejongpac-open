import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// [독립적인 인증 회귀 테스트 / Self-hosted authentication regression test]
// v5/out is mounted at /v5 to match the Next.js static-export basePath.
const v5Root = fileURLToPath(new URL("../", import.meta.url));
const exportRoot = resolve(v5Root, "out");
const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".txt": "text/plain; charset=utf-8",
};

if (!existsSync(resolve(exportRoot, "index.html"))) {
    throw new Error("v5/out/index.html이 없습니다. v5에서 npm run build를 먼저 실행하세요.");
}
if (!existsSync(resolve(v5Root, ".env.local"))) {
    throw new Error("v5/.env.local이 없습니다. 모의 인증 검사용 NEXT_PUBLIC_SUPABASE_URL 설정을 확인하세요.");
}

const server = createServer((req, res) => {
    void (async () => {
        if (req.method !== "GET" && req.method !== "HEAD") {
            res.writeHead(405, { Allow: "GET, HEAD" });
            res.end();
            return;
        }

        let url: URL;
        let requestPath: string;
        try {
            url = new URL(req.url || "/", "http://127.0.0.1");
            requestPath = decodeURIComponent(url.pathname);
        } catch {
            res.writeHead(400);
            res.end();
            return;
        }

        if (requestPath === "/v5") {
            res.writeHead(308, { Location: "/v5/" + url.search });
            res.end();
            return;
        }
        if (!requestPath.startsWith("/v5/")) {
            res.writeHead(404);
            res.end();
            return;
        }

        const path = requestPath.slice("/v5/".length);
        let target = resolve(exportRoot, path);
        const relativePath = relative(exportRoot, target);
        if (relativePath === ".." || relativePath.startsWith(".." + sep) ||
            relativePath.startsWith("/") || relativePath.includes("\0")) {
            res.writeHead(403);
            res.end();
            return;
        }

        let info;
        try {
            info = await stat(target);
            if (info.isDirectory()) {
                if (!requestPath.endsWith("/")) {
                    res.writeHead(308, { Location: url.pathname + "/" + url.search });
                    res.end();
                    return;
                }
                target = resolve(target, "index.html");
                info = await stat(target);
            }
        } catch {
            res.writeHead(404);
            res.end();
            return;
        }

        if (!info.isFile()) {
            res.writeHead(404);
            res.end();
            return;
        }
        res.writeHead(200, {
            "Content-Type": mimeTypes[extname(target).toLowerCase()] || "application/octet-stream",
            "Content-Length": info.size,
            "Cache-Control": "no-store",
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        createReadStream(target).on("error", () => res.destroy()).pipe(res);
    })().catch(() => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
    });
});

try {
    await new Promise<void>((ok, fail) => {
        server.once("error", fail);
        server.listen(0, "127.0.0.1", ok);
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("테스트 서버 포트를 확인하지 못했습니다.");
    }
    const url = "http://127.0.0.1:" + address.port + "/v5/";
    console.log("인증 브라우저 회귀 검사를 시작합니다: " + url);
    const exitCode = await new Promise<number>((ok, fail) => {
        const child = spawn(process.execPath, ["tests/account-auth-browser.ts", url], {
            cwd: v5Root,
            env: process.env,
            stdio: "inherit",
        });
        child.once("error", fail);
        child.once("exit", (code, signal) => ok(signal ? 1 : code ?? 1));
    });
    process.exitCode = exitCode;
} finally {
    await new Promise<void>((ok) => server.close(() => ok()));
}
