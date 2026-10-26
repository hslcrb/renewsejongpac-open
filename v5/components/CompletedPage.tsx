"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { NAV, PAGES } from "../src/data/catalog";
import { useCatalog } from "../src/catalog/CatalogProvider";
import type { CatalogSnapshot, PageContent } from "../src/catalog/types";
import type { CompletionCard, CompletionImage, CompletionPage, CompletionSection } from "../src/page-completion/types";
import { COMPLETION_PATHS } from "../src/page-completion/manifest";
import { SystemButton, SystemCheckbox, SystemField, SystemFilterButton, SystemLink } from "./SystemPrimitives";
import { SystemControlGroup } from "./SystemControlGroup";
import { SystemDisclosure } from "./SystemNavigation";
import SystemSurface from "./SystemSurface";
import { SystemText } from "./SystemText";
import ProgramCard from "./ProgramCard";
import ServiceRequestForm from "./ServiceRequestForm";
import ServiceGoods from "./ServiceGoods";
import DeepSearchDisclosure from "./DeepSearchDisclosure";
import { contextSearchReply } from "./DeepSearch";
import "../styles/completed-pages.css";

type PublishedCompletion = PageContent & { completion?: CompletionPage };
type LinkResolver = (href: string) => string | undefined;
type SiteNode = { path: string; title: string; href?: string; children: SiteNode[] };

// [공개 경로와 안전한 목적지 / Published routes and safe destinations]
// 실제 탐색 목록과 DB에 존재하는 내부 경로만 링크로 연결합니다.
// Only internal destinations present in navigation or the published catalog become links.
function publishedPaths(catalog: CatalogSnapshot): Set<string> {
    return new Set([
        ...PAGES.map(page => page.path), ...COMPLETION_PATHS, ...catalog.pages.map(page => page.path),
        ...NAV.flatMap(group => [group.path, ...group.items.map(([, path]) => path)]),
        ...catalog.programs.map(program => `/programs/${program.id}`),
        ...catalog.venues.flatMap(venue => [`/rental/venues/${venue.id}`, `/visit/spaces/${venue.id}`]),
        ...catalog.notices.map(notice => `/news/notices/${notice.id}`),
    ]);
}

function destination(href: string, paths: Set<string>, anchors: Set<string>): string | undefined {
    if (!href || href !== href.trim() || /[\\\u0000-\u001f\u007f]/.test(href)) return undefined;
    if (href.startsWith("#")) {
        try { return anchors.has(decodeURIComponent(href.slice(1))) ? href : undefined; } catch { return undefined; }
    }
    if (/^https?:\/\//i.test(href)) {
        try { return new URL(href).href; } catch { return undefined; }
    }
    if (/^(?:tel:|mailto:)[^\s]+$/i.test(href)) return href;
    const localHref = /^assets\//.test(href) ? `/${href}` : href;
    if (!localHref.startsWith("/") || localHref.startsWith("//")) return undefined;
    try {
        const url = new URL(localHref, "https://completion.local");
        const pathname = (url.pathname === "/v5" ? "/" : url.pathname.replace(/^\/v5\//, "/")).replace(/\/$/, "") || "/";
        const suffix = `${url.search}${url.hash}`;
        // 공개 정적 파일은 네이티브 링크로 열어 Next basePath가 중복되지 않게 합니다.
        // Open public files natively to avoid adding the Next base path a second time.
        if (/^\/assets\/.+\.(?:pdf|hwp|hwpx|docx?|xlsx?|pptx?|zip|7z|dwg|dxf|png|jpe?g|webp|gif|svg)$/i.test(pathname)) return `/v5${pathname}${suffix}`;
        return paths.has(pathname) ? `${pathname}${suffix}` : undefined;
    } catch { return undefined; }
}

function imageSource(src: string): string | undefined {
    if (/^https?:\/\//i.test(src)) return src;
    if (/^\/?(?:v5\/)?assets\//.test(src)) return `/v5/${src.replace(/^\/?(?:v5\/)?/, "")}`;
    return undefined;
}

function ResolvedLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    if (/^(?:https?:\/\/|tel:|mailto:|#|\/v5\/assets\/)/i.test(href)) return <a data-text="action" {...props} href={href}>{children}</a>;
    return <Link data-text="action" {...props} href={href}>{children}</Link>;
}

function ContentLink({ href, resolve, children, className = "", download }: { href: string; resolve: LinkResolver; children: ReactNode; className?: string; download?: boolean }) {
    const target = resolve(href);
    if (!target) return <span data-text="action" className={className}>{children}</span>;
    const external = /^https?:\/\//i.test(target);
    return <ResolvedLink data-text="action" className={`completed-text-link ${className}`.trim()} href={target} download={download || undefined} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}{external && <span data-text="caption" className="completed-sr-only"> (새 창)</span>}</ResolvedLink>;
}

// [원본 사진과 설명 / Source images and descriptions]
function ContentImage({ image, hero = false }: { image: CompletionImage; hero?: boolean }) {
    const src = imageSource(image.src);
    if (!src) return null;
    return <figure className={hero ? "completed-hero-image" : "completed-image"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={image.alt} loading={hero ? "eager" : "lazy"} decoding="async" />
        {image.caption && <figcaption data-text="caption">{image.caption}</figcaption>}
    </figure>;
}

// [목록의 실제 검색과 분류 / Search and categories derived from real list items]
function CardsSection({ section, resolve }: { section: Extract<CompletionSection, { type: "cards" }>; resolve: LinkResolver }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const categories = Array.from(new Set(section.items.map(item => item.category).filter(Boolean))) as string[];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const items = section.items.filter(item => (!category || item.category === category) &&
        `${item.title} ${item.description || ""} ${item.meta || ""} ${item.category || ""} ${item.status || ""}`.toLocaleLowerCase().includes(normalizedQuery));
    const hasImages = items.some(item => item.image && imageSource(item.image.src));

    return <>
        {section.searchable && <div className="completed-list-tools">
            <SystemField type="search" label={`${section.title} 검색`} value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="제목 또는 내용으로 검색" />
            {categories.length > 1 && <div className="completed-filters" role="group" aria-label={`${section.title} 분류`}>
                <SystemFilterButton selected={!category} onClick={() => setCategory("")}>전체</SystemFilterButton>
                {categories.map(item => <SystemFilterButton key={item} selected={category === item} onClick={() => setCategory(item)}>{item}</SystemFilterButton>)}
            </div>}
            <p data-text="meta" role="status" aria-live="polite">{items.length}개 항목{(query || category) && <SystemButton variant="quiet" onClick={() => { setQuery(""); setCategory(""); }}>검색 초기화</SystemButton>}</p>
        </div>}
        {section.searchable && <DeepSearchDisclosure
            title={section.title + " 대화형 검색"}
            onSearch={term => contextSearchReply(term, section.items.map(item => ({
                title: item.title,
                description: [item.description, item.meta, item.category, item.status].filter(Boolean).join(" · "),
                href: (() => { const value = resolve(item.href); return value?.startsWith("/") ? (value.startsWith("/v5/") ? value : "/v5" + value) : value; })(),
            })), section.title)}
        />}
        {items.length ? <ul className={`completed-card-list${hasImages ? " completed-card-list-media" : ""}`}>
            {items.map(item => <CompletionListItem key={item.id} item={item} resolve={resolve} />)}
        </ul> : <p data-text="body" className="completed-empty" role="status">{query || category ? "검색 조건에 맞는 항목이 없습니다. 검색어나 분류를 바꿔 주세요." : section.emptyMessage || "현재 공개된 항목이 없습니다."}</p>}
    </>;
}

function CompletionListItem({ item, resolve }: { item: CompletionCard; resolve: LinkResolver }) {
    const src = item.image && imageSource(item.image.src);
    const href = resolve(item.href);
    const external = Boolean(href && /^https?:\/\//i.test(href));
    const body = <>
        {src && <div className="completed-list-image">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={item.image!.alt} loading="lazy" decoding="async" draggable={false} /></div>}
        <div className="completed-list-copy">
            {(item.category || item.date || item.status) && <div data-text="meta" className="completed-item-meta">{item.category && <span data-text="meta">{item.category}</span>}{item.date && <time data-text="meta" dateTime={/^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : undefined}>{item.date}</time>}{item.status && <span data-text="meta">{item.status}</span>}</div>}
            <h3 data-text="item-title">{item.title}{external && <span data-text="caption" className="completed-sr-only"> (새 창)</span>}</h3>
            {item.description && <p data-text="body">{item.description}</p>}
            {item.meta && <p data-text="meta" className="completed-item-detail">{item.meta}</p>}
        </div>
    </>;
    return <li>{href ? <ResolvedLink className="completed-list-entry" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} draggable={false} onDragStart={event => event.preventDefault()}>{body}</ResolvedLink> : <div data-text="body" className="completed-list-entry">{body}</div>}</li>;
}

// [각 정보 형태를 보존하는 본문 / Content retaining the semantics of every section type]
function SectionBody({ section, resolve }: { section: CompletionSection; resolve: LinkResolver }) {
    switch (section.type) {
        case "prose": return <div className="completed-prose">{section.paragraphs.map((paragraph, index) => <p data-text="body" key={index}>{paragraph}</p>)}</div>;
        case "facts": return <dl className="completed-facts">{section.items.map((item, index) => <div key={`${item.label}-${index}`}><dt data-text="label">{item.label}</dt><dd data-text="body">{item.value}</dd></div>)}</dl>;
        case "table": return <><div className="completed-table-scroll" tabIndex={0} role="region" aria-label={`${section.title} 표, 좌우로 스크롤할 수 있습니다`}><table className="completed-table"><caption data-text="caption" className="completed-sr-only">{section.title}</caption><thead><tr>{section.columns.map((column, index) => <th data-text="label" scope="col" key={index}>{column}</th>)}</tr></thead><tbody>{section.rows.map((row, index) => <tr key={index}>{section.columns.map((_, column) => column === 0 ? <th data-text="label" scope="row" key={column}>{row[column] || "—"}</th> : <td data-text="body" key={column}>{row[column] || "—"}</td>)}</tr>)}</tbody></table></div>{section.note && <p data-text="caption" className="completed-note">{section.note}</p>}</>;
        case "timeline": return <ol className="completed-timeline">{section.items.map((item, index) => <li key={`${item.date}-${index}`}><p data-text="label" className="completed-timeline-date">{item.date}</p><div><h3 data-text="item-title">{item.title}</h3><p data-text="body">{item.body}</p></div></li>)}</ol>;
        case "faq": return <div className="completed-faq">{section.items.map((item, index) => <SystemDisclosure appearance="plain" summary={item.question} key={`${item.question}-${index}`}><p data-text="body">{item.answer}</p></SystemDisclosure>)}</div>;
        case "links":
        case "downloads": return <ul className="completed-resource-list">{section.items.map((item, index) => <li key={`${item.href}-${index}`}><div><ContentLink href={item.href} resolve={resolve} download={section.type === "downloads"}>{item.label}</ContentLink>{item.description && <p data-text="body">{item.description}</p>}</div>{section.type === "downloads" && resolve(item.href) && <span data-text="meta" className="completed-resource-kind">자료</span>}</li>)}</ul>;
        case "cards": return <CardsSection section={section} resolve={resolve} />;
        case "image": return <ContentImage image={section.image} />;
    }
}

// [공개된 시설을 직접 선택하는 비교 / Comparing selected venues from the published inventory]
function VenueComparison({ catalog }: { catalog: CatalogSnapshot }) {
    const [selected, setSelected] = useState<string[]>([]);
    const venues = catalog.venues.filter(venue => selected.includes(venue.id));
    const capacity = (value: string | number) => `${value}${typeof value === "number" || /^[\d,]+$/.test(String(value)) ? "석" : ""}`;
    return <section className="completed-section" id="completed-venue-compare" aria-labelledby="completed-venue-compare-title">
        <h2 data-text="heading" id="completed-venue-compare-title">시설 비교</h2>
        <p data-text="body">비교할 시설을 최대 3곳 선택하세요. 공개된 시설 정보를 나란히 확인할 수 있습니다.</p>
        <SystemSurface variant="inset" padding="lg" className="completed-venue-picker">
            <fieldset className="completed-venue-options"><legend data-text="label">비교할 시설 선택</legend>{catalog.venues.map(venue => <SystemCheckbox key={venue.id} checked={selected.includes(venue.id)} disabled={selected.length >= 3 && !selected.includes(venue.id)} onChange={event => { const checked = event.currentTarget.checked; setSelected(current => checked ? current.length < 3 && !current.includes(venue.id) ? [...current, venue.id] : current : current.filter(id => id !== venue.id)); }} label={<><strong data-text="label">{venue.name}</strong><span data-text="meta">{capacity(venue.capacity)}</span></>} />)}</fieldset>
            <div className="completed-compare-controls"><p data-text="meta" role="status" aria-live="polite">{venues.length} / 3곳 선택{venues.length >= 3 ? " · 3곳을 모두 선택했습니다." : ""}</p><SystemButton variant="secondary" disabled={!selected.length} onClick={() => setSelected([])}>선택 초기화</SystemButton></div>
        </SystemSurface>
        {venues.length ? <div className="completed-table-scroll" role="region" aria-label="선택한 시설 비교 표, 좌우로 스크롤할 수 있습니다" tabIndex={0}><table className="completed-table completed-compare-table"><caption data-text="caption" className="completed-sr-only">선택한 시설의 수용 규모, 위치와 특징</caption><thead><tr><th scope="col" data-text="label">비교 항목</th>{venues.map(venue => <th scope="col" data-text="item-title" key={venue.id}>{venue.name}</th>)}</tr></thead><tbody>
            <tr><th scope="row" data-text="label">수용 규모</th>{venues.map(venue => <td data-text="body" key={venue.id}>{capacity(venue.capacity)}</td>)}</tr>
            <tr><th scope="row" data-text="label">위치</th>{venues.map(venue => <td data-text="body" key={venue.id}>{venue.location || "게시된 위치 정보 없음"}</td>)}</tr>
            <tr><th scope="row" data-text="label">공간 소개</th>{venues.map(venue => <td data-text="body" key={venue.id}>{venue.description}</td>)}</tr>
            <tr><th scope="row" data-text="label">시설 특징</th>{venues.map(venue => <td data-text="body" key={venue.id}>{venue.features?.length ? <ul className="completed-feature-list">{venue.features.map(feature => <li data-text="body" key={feature}>{feature}</li>)}</ul> : "등록된 시설 특징 없음"}</td>)}</tr>
            <tr><th scope="row" data-text="label">상세·신청</th>{venues.map(venue => <td key={venue.id}><div className="completed-compare-actions"><SystemLink variant="secondary" href={`/rental/venues/${venue.id}`}>시설 상세</SystemLink><SystemLink href={`/rental/apply?venue=${encodeURIComponent(venue.id)}`}>이 시설로 신청</SystemLink></div></td>)}</tr>
        </tbody></table></div> : <p data-text="body" className="completed-empty">{catalog.venues.length ? "시설을 선택하면 비교표가 표시됩니다." : "현재 공개된 대관시설 정보가 없습니다."}</p>}
    </section>;
}

// [대관 공고 게시 월별 목록 / Rental notices grouped by their actual publication month]
function RentalCalendar({ catalog, resolve }: { catalog: CatalogSnapshot; resolve: LinkResolver }) {
    const [month, setMonth] = useState("");
    const notices = catalog.notices.filter(notice => /대관/.test(`${notice.title} ${notice.category} ${notice.content || notice.body || ""}`)).sort((a, b) => b.date.localeCompare(a.date));
    const publicationMonth = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : "unknown";
    const months = Array.from(new Set(notices.map(notice => publicationMonth(notice.date))));
    const monthLabel = (value: string) => value === "unknown" ? "게시일 미등록" : `${value.slice(0, 4)}년 ${Number(value.slice(5))}월`;
    return <section className="completed-section" id="completed-rental-calendar" aria-labelledby="completed-rental-calendar-title">
        <h2 data-text="heading" id="completed-rental-calendar-title">대관 공고 일정</h2>
        <p data-text="body">카탈로그에 공개된 대관 공고를 게시 월별로 모았습니다. 아래 날짜는 공고 게시일이며, 시설 사용 가능일과 접수 기간은 각 공고에서 확인하세요.</p>
        {months.length > 0 && <SystemField as="select" label="공고 게시 월" value={month} onChange={event => setMonth(event.currentTarget.value)}><option data-text="body" value="">전체 게시 월</option>{months.map(value => <option data-text="body" key={value} value={value}>{monthLabel(value)}</option>)}</SystemField>}
        {notices.length ? months.filter(value => !month || value === month).map(value => <div className="completed-notice-month" key={value}><h3 data-text="subheading">{monthLabel(value)}</h3><ul className="completed-notice-list">{notices.filter(notice => publicationMonth(notice.date) === value).map(notice => <li key={notice.id}><p data-text="meta">공고 게시일 {value === "unknown" ? "미등록" : <time data-text="meta" dateTime={notice.date}>{notice.date.replaceAll("-", ".")}</time>}</p><ContentLink href={`/news/notices/${notice.id}`} resolve={resolve}>{notice.title}</ContentLink>{(notice.content || notice.body) && <p data-text="body">{notice.content || notice.body}</p>}</li>)}</ul></div>) : <p data-text="body" className="completed-empty">현재 카탈로그에 공개된 대관 공고가 없습니다. 대관 안내의 공식 공고 경로에서 최신 접수를 확인하세요.</p>}
    </section>;
}

// [등록된 페이지 전체의 계층 / The complete hierarchy of registered pages]
function siteTree(catalog: CatalogSnapshot): SiteNode[] {
    const pages = new Map(PAGES.map(page => [page.path, { path: page.path, title: page.title }]));
    catalog.pages.forEach(page => pages.set(page.path, { path: page.path, title: page.title }));
    const nodes = new Map<string, SiteNode>();
    const roots: SiteNode[] = [];
    const ensure = (path: string): SiteNode => {
        const existing = nodes.get(path);
        if (existing) return existing;
        const page = pages.get(path);
        const groupTitle = path === "/policy" ? "정책 및 안내" : NAV.find(group => group.path === path)?.title;
        const node: SiteNode = { path, title: page?.title || groupTitle || path.split("/").filter(Boolean).at(-1) || "홈", href: page ? path : undefined, children: [] };
        nodes.set(path, node);
        const parentPath = path.substring(0, path.lastIndexOf("/"));
        if (parentPath && parentPath !== path) ensure(parentPath).children.push(node); else roots.push(node);
        return node;
    };
    pages.forEach(page => ensure(page.path));
    return roots;
}

function filterSiteTree(nodes: SiteNode[], query: string): SiteNode[] {
    return nodes.flatMap(node => {
        if (!query || `${node.title} ${node.path}`.toLocaleLowerCase().includes(query)) return [node];
        const children = filterSiteTree(node.children, query);
        return children.length ? [{ ...node, children }] : [];
    });
}

function SiteBranch({ node, resolve }: { node: SiteNode; resolve: LinkResolver }) {
    return <li>{node.href ? <ContentLink href={node.href} resolve={resolve}>{node.title}</ContentLink> : <span data-text="label">{node.title}</span>}{node.children.length > 0 && <ul>{node.children.map(child => <SiteBranch key={child.path} node={child} resolve={resolve} />)}</ul>}</li>;
}

function SiteMap({ catalog, resolve }: { catalog: CatalogSnapshot; resolve: LinkResolver }) {
    const [query, setQuery] = useState("");
    const tree = useMemo(() => siteTree(catalog), [catalog]);
    const results = filterSiteTree(tree, query.trim().toLocaleLowerCase());
    return <section className="completed-section" id="completed-sitemap" aria-labelledby="completed-sitemap-title"><h2 data-text="heading" id="completed-sitemap-title">전체 메뉴</h2><SystemField type="search" label="메뉴 찾기" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="메뉴 이름으로 검색" /><DeepSearchDisclosure title="대화로 메뉴 찾기" onSearch={term => contextSearchReply(term, catalog.pages.map(page => ({ title: page.title, description: page.description, href: "/v5" + page.path + (page.path.endsWith("/") ? "" : "/") })), "사이트 메뉴")} />{results.length ? <nav aria-label="전체 사이트 메뉴"><ul className="completed-sitemap-tree">{results.map(node => <SiteBranch key={node.path} node={node} resolve={resolve} />)}</ul></nav> : <p data-text="body" className="completed-empty" role="status">검색어와 일치하는 메뉴가 없습니다.</p>}</section>;
}

// [실제 프로그램과 연결된 목록 / Related programs from the published catalog]
function RelatedPrograms({ page, catalog }: { page: CompletionPage; catalog: CatalogSnapshot }) {
    const filter = page.relatedPrograms;
    if (!filter) return null;
    const query = filter.query?.trim().toLocaleLowerCase();
    const programs = catalog.programs.filter(program => (!filter.category || program.category === filter.category) && (!filter.tag || program.tags?.includes(filter.tag)) && (!query || `${program.title} ${program.description || ""} ${program.genre || ""} ${(program.tags || []).join(" ")}`.toLocaleLowerCase().includes(query)));
    return <section className="completed-section" id="completed-related-programs" aria-labelledby="completed-related-programs-title"><h2 data-text="heading" id="completed-related-programs-title">{filter.title}</h2><p data-text="meta">공개된 프로그램 {programs.length}개</p>{programs.length ? <div className="completed-program-grid">{programs.map(program => <ProgramCard key={program.id} program={program} />)}</div> : <p data-text="body" className="completed-empty">현재 이 주제에 연결된 공개 프로그램이 없습니다. 프로그램 전체 목록에서 다른 공연·전시·교육을 살펴보세요.</p>}<SystemLink variant="secondary" href="/programs">프로그램 전체 보기</SystemLink></section>;
}

// [새 완성 페이지의 독립 진입점 / Independent entry point for the newly completed pages]
export default function CompletedPage({ path }: { path: string }) {
    const { catalog, error, loading, refresh } = useCatalog();
    const record = catalog.pages.find(item => item.path === path) as PublishedCompletion | undefined;
    const page = record?.completion;
    const group = NAV.find(item => path === item.path || path.startsWith(`${item.path}/`));
    const parent = [...PAGES].filter(item => item.path !== path && item.path !== "/" && path.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
    const paths = useMemo(() => publishedPaths(catalog), [catalog]);
    const title = page?.title || record?.title || PAGES.find(item => item.path === path)?.title || "페이지 안내";
    const isEnglish = path === "/english";
    const goodsMode = page?.special === "goods" || page?.special === "cart" || page?.special === "orders" ? page.special : undefined;
    const sectionLinks = page?.sections.map((section, index) => ({ id: `completed-section-${index}`, title: section.title })) || [];
    if (page?.special === "venue-compare") sectionLinks.push({ id: "completed-venue-compare", title: "시설 비교" });
    if (page?.special === "rental-calendar") sectionLinks.push({ id: "completed-rental-calendar", title: "대관 공고 일정" });
    if (page?.special === "sitemap") sectionLinks.push({ id: "completed-sitemap", title: "전체 메뉴" });
    if (goodsMode) sectionLinks.push({ id: "completed-goods-service", title: goodsMode === "goods" ? "굿즈 목록" : goodsMode === "cart" ? "장바구니" : "구매 요청 내역" });
    if (page?.relatedPrograms) sectionLinks.push({ id: "completed-related-programs", title: page.relatedPrograms.title });
    if (page?.form && page.special !== "cart") sectionLinks.push({ id: "completed-request", title: page.form.title });
    const anchors = new Set(sectionLinks.map(section => section.id));
    const resolve: LinkResolver = href => destination(href, paths, anchors);

    return <div className="container completed-page" data-component-id="completed-page" lang={isEnglish ? "en" : undefined}>
        <nav className="completed-breadcrumbs" aria-label="현재 위치"><Link data-text="action" href="/">홈</Link>{group && group.path !== path && <><span aria-hidden="true">/</span><Link data-text="action" href={group.path}>{group.title}</Link></>}{parent && parent.path !== group?.path && <><span aria-hidden="true">/</span><Link data-text="action" href={parent.path}>{parent.title}</Link></>}<span aria-hidden="true">/</span><span data-text="label" aria-current="page">{title}</span></nav>
        <header className="completed-heading"><SystemText as="h1" variant="title">{title}</SystemText>{page?.summary && <SystemText as="p" variant="lead">{page.summary}</SystemText>}</header>
        {group && <SystemControlGroup as="nav" className="completed-group-navigation" aria-label={`${group.title} 메뉴`} columns={{ compact: 2, medium: 3, wide: 6 }}>{group.items.map(([label, href]) => <SystemLink key={href} variant={path === href || path.startsWith(`${href}/`) ? "primary" : "secondary"} href={href} aria-current={path === href ? "page" : undefined}>{label}</SystemLink>)}</SystemControlGroup>}
        {page ? <>
            {page.image && <ContentImage image={page.image} hero />}
            <div className="completed-body-layout">
                {sectionLinks.length > 1 && <aside className="completed-outline"><nav aria-label={isEnglish ? "On this page" : "이 페이지에서"}><SystemText as="p" variant="label">{isEnglish ? "On this page" : "이 페이지에서"}</SystemText><ol>{sectionLinks.map(section => <li key={section.id}><a data-text="action" href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav></aside>}
                <div className="completed-main" key={path}>
                    {page.sections.map((section, index) => <section className={`completed-section completed-section-${section.type}`} id={`completed-section-${index}`} aria-labelledby={`completed-section-title-${index}`} key={index}><h2 data-text="heading" id={`completed-section-title-${index}`}>{section.title}</h2><SectionBody section={section} resolve={resolve} /></section>)}
                    {page.special === "venue-compare" && <VenueComparison catalog={catalog} />}
                    {page.special === "rental-calendar" && <RentalCalendar catalog={catalog} resolve={resolve} />}
                    {page.special === "sitemap" && <SiteMap catalog={catalog} resolve={resolve} />}
                    {goodsMode && <div className="completed-service" id="completed-goods-service"><ServiceGoods mode={goodsMode} page={page} /></div>}
                    <RelatedPrograms page={page} catalog={catalog} />
                    {page.form && goodsMode !== "cart" && <section className="completed-section" id="completed-request" aria-label={page.form.title}><ServiceRequestForm page={page} /></section>}
                    {page.sources.length > 0 && <footer className="completed-sources"><h2 data-text="item-title">{isEnglish ? "Sources and official information" : "자료 출처와 최신 안내"}</h2><ul>{page.sources.map((source, index) => <li key={`${source.url}-${index}`}><ContentLink href={source.url} resolve={resolve}>{source.label}</ContentLink></li>)}</ul></footer>}
                </div>
            </div>
        </> : <SystemSurface variant="inset" padding="lg" className="completed-load-state"><p data-text="body" role="status">{loading ? "페이지 내용을 불러오는 중입니다." : error || "현재 페이지 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}</p><SystemButton variant="secondary" disabled={loading} onClick={() => { void refresh(); }}>다시 불러오기</SystemButton></SystemSurface>}
    </div>;
}
