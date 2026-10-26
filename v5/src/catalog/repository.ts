import type { CatalogRepository, CatalogSnapshot } from "./types.ts";

// [공개 DB 스냅샷 / Public database snapshot: a failed request is never a successful refresh.]
export function createCatalogRepository(url: string, key: string, request: typeof fetch = fetch): CatalogRepository {
    return { async loadPublishedCatalog() {
        if (!url || !key) throw new Error("공개 콘텐츠 DB 설정이 없습니다.");
        const response = await request(`${url.replace(/\/$/, "")}/rest/v1/rpc/sejong_catalog_snapshot`, {
            method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: "{}", cache: "no-store",
        });
        if (!response.ok) throw new Error(`콘텐츠를 불러오지 못했습니다 (${response.status}).`);
        const data = await response.json();
        assertCatalogSnapshot(data);
        return data;
    } };
}
export function assertCatalogSnapshot(value: unknown): asserts value is CatalogSnapshot {
    if (!value || typeof value !== "object") throw new Error("콘텐츠 스냅샷 형식이 올바르지 않습니다.");
    const item = value as Record<string, unknown>;
    if (item.version !== 1 || typeof item.generatedAt !== "string" ||
        !["programs", "venues", "companies", "notices", "homeFeatures", "ticketOpenings", "media", "sessions", "pages"].every(key => Array.isArray(item[key])))
        throw new Error("콘텐츠 스냅샷 형식이 올바르지 않습니다.");
    for (const key of ["programs", "venues", "companies", "notices", "homeFeatures", "ticketOpenings", "media", "sessions"]) {
        const rows=item[key] as {id?:unknown}[];
        if (rows.some(row => typeof row?.id !== "string") || new Set(rows.map(row=>row.id)).size!==rows.length) throw new Error(`콘텐츠 식별자가 없거나 중복됩니다: ${key}`);
    }
    const pages=item.pages as {path?:unknown;title?:unknown;blocks?:unknown}[];
    if(pages.some(page=>typeof page?.path!=="string"||!page.path.startsWith("/")||typeof page.title!=="string"||!Array.isArray(page.blocks))) throw new Error("페이지 콘텐츠 형식이 올바르지 않습니다.");
    if(new Set(pages.map(page=>page.path)).size!==pages.length) throw new Error("페이지 경로가 중복됩니다.");
}
