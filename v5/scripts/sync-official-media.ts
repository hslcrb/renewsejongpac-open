import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { OFFICIAL_MEDIA } from "../src/data/official-media.ts";

// [공식 원본을 수정 없이 보관 / Vendor original official media without alteration]
const directory = fileURLToPath(new URL("../public/assets/images/official/", import.meta.url));
fs.mkdirSync(directory, { recursive: true });
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
for (const media of Object.values(OFFICIAL_MEDIA)) {
    const destination = path.join(directory, media.file);
    if (fs.existsSync(destination) && hash(fs.readFileSync(destination)) === media.sha256) continue;
    const url = new URL(media.source);
    if (!url.hostname.endsWith(".sejongpac.or.kr")) throw new Error("Unexpected media origin");
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/"))
        throw new Error(`Image download failed: ${media.file}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (hash(bytes) !== media.sha256) throw new Error(`Official source changed; review before replacing ${media.file}`);
    fs.writeFileSync(destination, bytes);
}
console.log(`Verified ${Object.keys(OFFICIAL_MEDIA).length} original official images.`);
