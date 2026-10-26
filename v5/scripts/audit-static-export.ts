import fs from "node:fs";
import path from "node:path";
import { parse } from "parse5";

const root = path.resolve("out");
const files = fs.readdirSync(root, { recursive: true }).map(String).filter(file => fs.statSync(path.join(root, file)).isFile());
const html = files.filter(file => file.endsWith(".html"));
const failures: { page: string; attribute: string; value: string; target: string }[] = [];
let references = 0;

// [정적 호스팅에서 실제로 존재하는 링크와 자산 / Links and assets in the actual static export]
for (const file of html) {
    const document = parse(fs.readFileSync(path.join(root, file), "utf8"));
    function inspect(node: any) {
        for (const attribute of node.attrs || []) {
            if (!["href", "src"].includes(attribute.name) || !attribute.value || /^(?:#|data:|blob:|https?:|mailto:|tel:|javascript:)/i.test(attribute.value)) continue;
            const url = new URL(attribute.value, "https://export.invalid/v5/" + file);
            if (!url.pathname.startsWith("/v5/")) continue;
            const relative = decodeURIComponent(url.pathname.slice(4));
            if (!relative || relative.startsWith("_next/") && attribute.name === "href" && !relative.includes(".")) continue;
            references++;
            const target = path.resolve(root, relative);
            if (!target.startsWith(root + path.sep) && target !== root) throw new Error("Reference escapes export: " + relative);
            const exists = fs.existsSync(target) && fs.statSync(target).isFile()
                || fs.existsSync(path.join(target, "index.html"))
                || fs.existsSync(target + ".html");
            if (!exists) failures.push({ page: file.replaceAll("\\", "/"), attribute: attribute.name, value: attribute.value, target: relative });
        }
        for (const child of node.childNodes || []) inspect(child);
    }
    inspect(document);
}
const report = { htmlFiles: html.length, references, failures };
fs.mkdirSync(".lemonade/component-implementation", { recursive: true });
fs.writeFileSync(".lemonade/component-implementation/static-references.json", JSON.stringify(report, null, 4) + "\n");
console.log(JSON.stringify({ htmlFiles: html.length, references, failures: failures.length }));
if (failures.length) { console.error(JSON.stringify(failures.slice(0, 30), null, 4)); process.exitCode = 1; }
