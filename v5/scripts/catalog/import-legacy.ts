import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { CatalogSnapshot, PageContent } from "../../src/catalog/types.ts";

// One-time import artifact; runtime and subsequent builds read the database only.
const root = new URL("../../", import.meta.url);
const legacy = JSON.parse(await readFile(new URL("scripts/catalog/legacy-source.json", root), "utf8"));
const media = Object.entries(legacy.media).map(([id, row]) => ({ id, ...(row as object) }));
const venues = legacy.venues.map((v: any) => ({ ...v, ...(v.id === "grand" ? { image: "" } : {}) }));
const programs = legacy.programs.map((p: any) => ({ ...p, price: null, time: null, times: [], duration: null, age: null,
    image: p.id === "dance" ? p.image : "", imageAlt: p.id === "dance" ? p.imageAlt : "",
    status: "일정 확인 중", bookingEnabled: false, sourceState: "unverified", revision: 1,
}));
const homeFeatures = legacy.homeFeatures.map((f: any) => ({ ...f, image: f.id === "carmen" ? "" : f.image, alt: f.id === "carmen" ? "" : f.alt }));
let pages: PageContent[] = [];
if (!process.argv.includes("--bootstrap")) {
    const content = await import("../../src/catalog/page-content.ts");
    pages = content.PAGE_CONTENT;
}
const snapshot: CatalogSnapshot = { version: 1, generatedAt: "2026-10-23T00:00:00Z", programs, venues,
    companies: legacy.companies, notices: legacy.notices, homeFeatures, ticketOpenings: legacy.ticketOpenings,
    media: media as CatalogSnapshot["media"], sessions: [], pages };
const q = (value: unknown): string => value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;
const sql: string[] = ["-- Imported source revision is private; normalized published rows are DB-authoritative.", "begin;"];
function insert(table: string, row: Record<string, unknown>, raw: unknown, source: string) {
    const columns=Object.keys(row),updates=columns.filter(column=>column!=="id");
    sql.push(`insert into public.sejong_${table} as target (${columns.join(",")}) values (${Object.values(row).map(v => typeof v === "object" && v !== null ? json(v) : typeof v === "boolean" || typeof v === "number" ? String(v) : q(v)).join(",")}) on conflict (id) do update set ${updates.map(column=>`${column}=excluded.${column}`).join(",")} where row(${updates.map(column=>`target.${column}`).join(",")}) is distinct from row(${updates.map(column=>`excluded.${column}`).join(",")});`);
    sql.push(`insert into sejong_private.content_revisions(entity_table,entity_id,revision,raw_source,source_path) select ${q(`sejong_${table}`)},${q(row.id)},1,${json(raw)},${q(source)} where not exists(select 1 from sejong_private.content_revisions where entity_table=${q(`sejong_${table}`)} and entity_id=${q(row.id)} and revision=1);`);
}
for (const m of media as any[]) insert("media", { id: m.id, payload: m, source_url: m.source, source_state: "verified" }, m, "src/data/official-media.ts");
for (const v of venues) insert("venues", { id: v.id, name: v.name, media_id: ({"m-theater":"venue-m","s-theater":"venue-s",chamber:"venue-chamber",gallery:"venue-gallery"} as Record<string,string>)[v.id] || null, payload: v }, legacy.venues.find((r:any)=>r.id===v.id), "src/data/catalog.ts#VENUES");
for (const p of programs) insert("programs", { id: p.id, title:p.title,venue_id:venues.find((v:any)=>v.name===p.venue)?.id || null, media_id:p.id==="dance"?"ilmu-poster":null,starts_on:p.start,ends_on:p.end,price:null,source_state:"unverified",payload:p }, legacy.programs.find((r:any)=>r.id===p.id), "src/data/catalog.ts#PROGRAMS");
for (const c of legacy.companies) insert("companies",{id:c.id,payload:c},c,"src/data/catalog.ts#COMPANIES");
for (const n of legacy.notices) insert("notices",{id:n.id,published_on:n.date,payload:n},n,"src/data/catalog.ts#NOTICES");
for (const o of legacy.ticketOpenings) insert("ticket_openings",{id:o.id,opens_at:o.opensAt,payload:o},o,"src/data/ticket-openings.ts");
for (const [index,f] of homeFeatures.entries()) insert("home_features",{id:f.id,program_id:f.id,media_id:f.id==="dance"?"ilmu-stage":f.id==="light"?"venue-gallery":null,sort_order:index,payload:f},legacy.homeFeatures[index],"src/data/home-features.ts");
for (const p of pages) insert("pages",{id:p.path,payload:p,published:p.status!=="draft"},p,"src/catalog/page-content.ts");
sql.push("insert into public.sejong_seat_plans(id,venue_id,name,source_state,booking_enabled) values('legacy-grid','grand','이전 40석 배치 — 검증되지 않음','unverified',false) on conflict do nothing;");
for (const row of ["A","B","C","D","E"]) for(let number=1;number<=8;number++) sql.push(`insert into public.sejong_venue_seats(id,seat_plan_id,label,row_label,seat_number) values('legacy-${row}${number}','legacy-grid','${row}${number}','${row}',${number}) on conflict do nothing;`);
sql.push("commit;");
await mkdir(new URL("src/generated/",root),{recursive:true});
await writeFile(new URL("src/generated/catalog-snapshot.json",root),`${JSON.stringify(snapshot,null,2)}\n`);
await writeFile(new URL("supabase/catalog-seed.sql",root),`${sql.join("\n")}\n`);
console.log(`Imported ${programs.length} programs, ${pages.length} pages; no unverified sellable sessions.`);
