import { notFound } from "next/navigation";
import CatalogPage from "../../components/CatalogPage";
import CompletedPage from "../../components/CompletedPage";
import { isCompletionPath } from "../../src/page-completion/manifest";
import { PAGES, VENUES, NOTICES } from "../../src/data/catalog";
import { CATALOG_SNAPSHOT } from "../../src/catalog/snapshot";

// [게시 경로의 정적 생성 / Generate published information routes]
export function generateStaticParams() {
    const routes = new Set<string>();

    for (const page of PAGES) {
        if (page.path && page.path !== "/") {
            const p = page.path.replace(/^\//, "");
            // 이미 전용 폴더가 있는 라우트는 slug에서 제외
            if (
                !p.startsWith("design-rules") &&
                p !== "about/introduction" &&
                !p.startsWith("account") &&
                p !== "programs" &&
                !/^programs\/[^/]+$/.test(p)
            ) {
                routes.add(p);
            }
        }
    }

    for (const venue of VENUES) {
        routes.add(`rental/venues/${venue.id}`);
        routes.add(`visit/spaces/${venue.id}`);
    }

    for (const notice of NOTICES) {
        routes.add(`news/notices/${notice.id}`);
    }

    return Array.from(routes).map((route) => ({
        slug: route.split("/"),
    }));
}


// [제목뿐인 범용 본문을 사용하지 않는 경로 / Resolve an actual content record]
export default function CatalogDynamicPage({ params }: { params: { slug: string[] } }) {
    const path = "/" + params.slug.join("/");
    const known = CATALOG_SNAPSHOT.pages.some(page => page.path === path) || VENUES.some(venue => path === `/visit/spaces/${venue.id}` || path === `/rental/venues/${venue.id}`) || NOTICES.some(notice => path === `/news/notices/${notice.id}`);
    if (!known) notFound();
    if (isCompletionPath(path)) return <CompletedPage path={path} />;
    return <CatalogPage path={path} />;
}
