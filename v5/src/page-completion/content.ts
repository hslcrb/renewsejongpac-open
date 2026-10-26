import { ABOUT_COMPLETIONS } from "./content/about.ts";
import { VISIT_COMPLETIONS } from "./content/visit.ts";
import { PROGRAM_COMPLETIONS } from "./content/programs.ts";
import { NEWS_COMPLETIONS } from "./content/news.ts";
import { UTILITY_COMPLETIONS } from "./content/utility.ts";
import { RENTAL_COMPLETIONS } from "./content/rental.ts";
import { COMPLETION_PATHS, isCompletionPath } from "./manifest.ts";
import type { CompletionPage } from "./types.ts";

// [DB 수입 전용 편집 원본 / Editorial source for database import only]
export const COMPLETION_PAGES: CompletionPage[] = [...ABOUT_COMPLETIONS, ...VISIT_COMPLETIONS, ...PROGRAM_COMPLETIONS, ...NEWS_COMPLETIONS, ...UTILITY_COMPLETIONS, ...RENTAL_COMPLETIONS]
    .map(page => page.path === "/news/goods/cart" ? { ...page, form: { kind: "order" as const, title: "구매 요청" } } : page)
    .sort((a, b) => a.path.localeCompare(b.path));

export function assertCompletionCoverage(pages: readonly CompletionPage[] = COMPLETION_PAGES): void {
    if (pages.length !== COMPLETION_PATHS.length || new Set(pages.map(page => page.path)).size !== pages.length || pages.some(page => !isCompletionPath(page.path)))
        throw new Error("미구현 페이지 허용 목록과 편집 원본이 일치하지 않습니다.");
    for (const page of pages) {
        if (!page.title.trim() || !page.summary.trim() || page.sections.length < 2 || !page.sources.length)
            throw new Error(`페이지 본문과 출처가 부족합니다: ${page.path}`);
        if (page.sources.some(source => !/^https:\/\//.test(source.url))) throw new Error(`출처 주소가 올바르지 않습니다: ${page.path}`);
        for (const section of page.sections) {
            if (section.type === "table" && section.rows.some(row => row.length !== section.columns.length)) throw new Error(`표의 열 수가 다릅니다: ${page.path}`);
            if (["links", "downloads", "cards"].includes(section.type)) {
                const items = (section as { items: { href: string }[] }).items;
                if (items.some(item => !/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(item.href))) throw new Error(`이동 주소가 올바르지 않습니다: ${page.path}`);
            }
        }
    }
}
assertCompletionCoverage();
