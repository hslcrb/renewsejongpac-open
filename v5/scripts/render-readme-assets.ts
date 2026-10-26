import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DESIGN_TOKEN_VALUES } from "../src/data/design-tokens.ts";

// [문서에도 같은 브랜드색 사용 / Use the product palette in the documentation]
const repo = new URL("../../", import.meta.url);
const target = new URL("docs/readme/", repo);
const check = process.argv.includes("--check");
const color = (name: string) => DESIGN_TOKEN_VALUES[`--color-${name}`];
const ink = color("black"), paper = color("white"), sky = color("sky"), yellow = color("yellow");
const line = color("line-gentle"), muted = color("gray-600"), subtle = color("gray-050");
const green = color("quick-mint");
const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const title = (value: string) => `<title>${xml(value)}</title>`;
const readSvg = (file: URL) => readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
const favicon = readSvg(new URL("v5/public/assets/favicon.svg", repo));
const supabase = readSvg(new URL("brand/supabase.svg", target));
const vercel = readSvg(new URL("brand/vercel.svg", target));
const font = readFileSync(new URL("v5/public/assets/fonts/woff2/WantedSansVariable.woff2", repo)).toString("base64");
const icon = (source: string, x: number, y: number, size: number) => source.replace(/<svg\b[^>]*>/, original => {
    const viewBox = /viewBox="([^"]+)"/.exec(original)?.[1];
    if (!viewBox) throw new Error("Logo is missing a viewBox");
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}" fill="none">`;
});
const tile = (source: string, label: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88" role="img" aria-label="${xml(label)}">
${title(label)}<rect x=".5" y=".5" width="87" height="87" rx="22" fill="${paper}" stroke="${line}"/>
${icon(source, 20, 20, 48)}</svg>\n`;

// [스크립트 없이 선택하는 구조도 / A script-free, selectable architecture diagram]
const diagram = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="872" viewBox="0 0 1120 872" role="document" aria-labelledby="diagram-title diagram-description">
<title id="diagram-title">세종문화회관 v5 구조 / How v5 works</title>
<desc id="diagram-description">관람객의 화면은 Vercel에서 전달하고, 로그인과 콘텐츠·회원 기록은 Supabase가 관리합니다. 위의 링크로 회원 저장, 콘텐츠 발행, 전체 흐름과 모션 정지를 선택할 수 있습니다. Browser UI is served by Vercel. Supabase manages authentication and data. Select a flow using the keyboard or pointer.</desc>
<style>
@font-face{font-family:ReadmeWanted;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 1000;font-display:swap}
svg{background:${paper};color:${ink};font-family:ReadmeWanted,system-ui,'Segoe UI','Malgun Gothic',sans-serif}
text{fill:${ink};font-size:22px}a{cursor:pointer}.muted{fill:${muted}}.heading{font-size:36px;font-weight:700}.node-title{font-size:28px;font-weight:650}.label{font-size:24px;font-weight:600}
.frame,.tab{fill:${paper};stroke:${line};stroke-width:1;transition:fill 160ms,stroke 160ms}.node:hover .frame,.node:focus-visible .frame{stroke:${muted};stroke-width:3}.mode:hover .tab,.mode:focus-visible .tab{stroke:${muted};stroke-width:3}
.flow{fill:none;stroke-width:3;stroke-dasharray:8 9;animation:travel 3s linear infinite;transition:opacity 160ms}.member-flow{stroke:${yellow}}.publish-flow{stroke:${green}}.delivery-flow{stroke:${sky}}.detail{display:none}
#member:target ~ .scene .flow:not(.member-flow),#publish:target ~ .scene .flow:not(.publish-flow){opacity:.18}
#member:target ~ .scene .all-detail,#publish:target ~ .scene .all-detail,#pause:target ~ .scene .all-detail{display:none}
#member:target ~ .scene .member-detail,#publish:target ~ .scene .publish-detail,#pause:target ~ .scene .pause-detail{display:inline}
#member:target ~ .scene .member-tab{fill:${yellow}}#publish:target ~ .scene .publish-tab{fill:${green}}#pause:target ~ .scene .pause-tab{fill:${sky}}
#pause:target ~ .scene .flow{animation-play-state:paused}
@keyframes travel{to{stroke-dashoffset:-68}}@media(prefers-reduced-motion:reduce){.flow{animation:none}.frame,.tab{transition:none}}
</style>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="${muted}" stroke-width="1.4"/></marker></defs>
<g id="all"/><g id="member"/><g id="publish"/><g id="pause"/>
<g class="scene">
<rect x=".5" y=".5" width="1119" height="871" rx="28" fill="${paper}" stroke="${line}"/>
<text x="32" y="64" class="heading">화면과 데이터가 만나는 곳</text>
<text x="32" y="102" class="muted">Sejong v5 · Browser, database and deployment</text>
<a href="#all" class="mode" aria-label="전체 흐름 / All flows"><rect class="tab" x="32" y="128" width="200" height="48" rx="14"/><text x="132" y="159" text-anchor="middle">전체 흐름</text></a>
<a href="#member" class="mode" aria-label="회원 저장 흐름 / Member data flow"><rect class="tab member-tab" x="248" y="128" width="200" height="48" rx="14"/><text x="348" y="159" text-anchor="middle">회원 저장</text></a>
<a href="#publish" class="mode" aria-label="콘텐츠 발행 흐름 / Content publishing flow"><rect class="tab publish-tab" x="464" y="128" width="200" height="48" rx="14"/><text x="564" y="159" text-anchor="middle">콘텐츠 발행</text></a>
<a href="#pause" class="mode" aria-label="움직임 멈춤 / Pause motion"><rect class="tab pause-tab" x="680" y="128" width="200" height="48" rx="14"/><text x="780" y="159" text-anchor="middle">움직임 멈춤</text></a>
<path class="flow delivery-flow" d="M944 258V220H176V258" marker-end="url(#arrow)"/>
<rect x="482" y="198" width="156" height="36" rx="12" fill="${paper}"/><text x="560" y="224" text-anchor="middle">화면 전달</text>
<path class="flow member-flow" d="M326 406H410" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="368" y="385" text-anchor="middle">저장</text>
<path class="flow publish-flow" d="M710 406H794" marker-end="url(#arrow)"/>
<text x="752" y="385" text-anchor="middle">발행</text>
<a class="node" href="https://renewsejongpac.rhee.life/v5/" target="_blank" aria-label="v5 웹사이트 열기 / Open the website">
<rect class="frame" x="32.5" y="258.5" width="287" height="295" rx="24"/>
${icon(favicon,56,282,72)}
<text x="56" y="394" class="node-title">관람객의 화면</text>
<text x="56" y="438">공연을 찾고</text><text x="56" y="472">나의 기록을 봅니다</text>
<text x="56" y="522" text-decoration="underline">웹사이트 열기 →</text></a>
<a class="node" href="https://supabase.com/docs" target="_blank" aria-label="Supabase 문서 열기 / Open Supabase documentation">
<rect class="frame" x="416.5" y="258.5" width="287" height="295" rx="24"/>
<rect x="440.5" y="282.5" width="71" height="71" rx="18" fill="${paper}" stroke="${line}"/>
${icon(supabase,454,296,44)}
<text x="440" y="394" class="node-title">Supabase</text>
<text x="440" y="438">로그인과 회원 기록</text><text x="440" y="472">공연·페이지 콘텐츠</text>
<text x="440" y="522" text-decoration="underline">기술 문서 열기 →</text></a>
<a class="node" href="https://vercel.com/docs" target="_blank" aria-label="Vercel 문서 열기 / Open Vercel documentation">
<rect class="frame" x="800.5" y="258.5" width="287" height="295" rx="24"/>
<rect x="824.5" y="282.5" width="71" height="71" rx="18" fill="${paper}" stroke="${line}"/>
${icon(vercel,838,296,44)}
<text x="824" y="394" class="node-title">Vercel</text>
<text x="824" y="438">Next.js 정적 빌드</text><text x="824" y="472">공개 주소로 화면 제공</text>
<text x="824" y="522" text-decoration="underline">기술 문서 열기 →</text></a>
<rect x="32" y="594" width="1056" height="88" rx="20" fill="${subtle}"/>
<text x="56" y="630" class="label">GitHub main</text><text x="56" y="662" class="muted">검증한 소스</text>
<text x="322" y="648">→ Vercel 자동 빌드 → 정적 파일 배포 → 화면 전달</text>
<rect x="32" y="710" width="1056" height="128" rx="20" fill="${subtle}"/>
<g class="all-detail"><text x="56" y="752">화면은 Vercel이, 로그인과 데이터는 Supabase가 담당합니다.</text><text x="56" y="790" class="muted">Select a flow above, or open each service for more information.</text></g>
<g class="detail member-detail"><text x="56" y="752">로그인 → 본인 확인 → 내 관심 공연·관람노트 저장</text><text x="56" y="790" class="muted">Supabase Auth identifies the user. RLS protects each member's rows.</text></g>
<g class="detail publish-detail"><text x="56" y="752">공개 DB 콘텐츠 → 빌드 스냅샷 → 정적 HTML → 브라우저 갱신</text><text x="56" y="790" class="muted">A build reads the published catalog; the browser can refresh it.</text></g>
<g class="detail pause-detail"><text x="56" y="752">움직임을 멈췄습니다. 다른 흐름을 고르면 다시 이어집니다.</text><text x="56" y="790" class="muted">Reduced-motion preferences also stop the moving paths automatically.</text></g>
</g></svg>\n`;

for (const [name, content] of Object.entries({
    "favicon-tile.svg": tile(favicon, "세종문화회관 v5 파비콘 / Project favicon"),
    "supabase-tile.svg": tile(supabase, "Supabase · 인증과 데이터베이스 / Authentication and database"),
    "vercel-tile.svg": tile(vercel, "Vercel · 빌드와 배포 / Build and deployment"),
    "system-overview.svg": diagram,
})) {
    const file = new URL(name, target);
    if (check) {
        if (readFileSync(file, "utf8").replace(/\r\n/g, "\n") !== content) throw new Error(`Stale README asset: ${name}`);
    } else writeFileSync(file, content, "utf8");
}
console.log(`README SVG assets ${check ? "checked" : "generated"}: ${fileURLToPath(target)}`);
