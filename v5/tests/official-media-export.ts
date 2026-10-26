import fs from "node:fs";
import path from "node:path";
import { OFFICIAL_MEDIA } from "../src/data/official-media.ts";

// [전체 정적 경로의 이미지 전수 검사 / Audit media across every exported route]
const root = path.resolve("out");
const htmlFiles: string[] = [];
function walk(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!["assets", "_next", "v2"].includes(entry.name)) walk(absolute);
        } else if (entry.name.endsWith(".html") && entry.name !== "legacy.html") htmlFiles.push(absolute);
    }
}
walk(root);
const known = new Set([
    ...Object.values(OFFICIAL_MEDIA).map(media => "official/" + media.file),
    "sejong-wordmark.png", "sejong-official-symbol.png", "sejong-official-wordmark.png",
    "seoul-footer-logo.png", "sejong-ilmu-video.jpg", "sejong-grand-facade.png",
    "sejong-grand-interior.png", "sejong-grand-auditorium.png", "sejong-grand-exterior.png",
]);
const sources = new Set<string>();
const errors: string[] = [];
for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    for (const [, source] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
        sources.add(source);
        if (!source.startsWith("/v5/assets/")) { errors.push(`${file}: unexpected source ${source}`); continue; }
        if (!fs.existsSync(path.join(root, source.slice("/v5/".length)))) errors.push(`${file}: missing ${source}`);
        if (source.startsWith("/v5/assets/images/") && !known.has(source.slice("/v5/assets/images/".length)))
            errors.push(`${file}: unverified image ${source}`);
    }
}
const report = { htmlPages: htmlFiles.length, distinctImageSources: [...sources].sort(), errors };
fs.mkdirSync(".lemonade/media-feedback", { recursive: true });
fs.writeFileSync(".lemonade/media-feedback/export-report.json", JSON.stringify(report, null, 2));
console.log({ htmlPages: htmlFiles.length, distinctImageSources: sources.size, errors });
if (errors.length) process.exitCode = 1;
