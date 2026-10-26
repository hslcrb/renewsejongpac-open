"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV } from "../src/data/catalog";
import { useCatalog } from "../src/catalog/CatalogProvider";
import type { PageContentBlock } from "../src/catalog/types";
import { SystemField, SystemLink, SystemNotice } from "./SystemPrimitives";
import DeepSearch from "./DeepSearch";
import { SystemDisclosure } from "./SystemNavigation";
import { SystemControlGroup } from "./SystemControlGroup";
import SystemSurface from "./SystemSurface";
import ProgramCard from "./ProgramCard";

// [DB 본문 블록과 실제 목록의 조합 / Compose database content with live collections]
export default function CatalogPage({ path }: { path: string }) {
    const { catalog } = useCatalog();
    const page = catalog.pages.find(item => item.path === path);
    const venue = /^\/(visit\/spaces|rental\/venues)\//.test(path)
        ? catalog.venues.find(item => path.endsWith(`/${item.id}`)) : undefined;
    const notice = path.startsWith("/news/notices/")
        ? catalog.notices.find(item => path.endsWith(`/${item.id}`)) : undefined;
    const group = NAV.find(item => path === item.path || path.startsWith(`${item.path}/`));
    const [query, setQuery] = useState("");
    useEffect(() => { if (path === "/search") setQuery(new URLSearchParams(window.location.search).get("q") || ""); }, [path]);
    const title = page?.title || venue?.name || notice?.title || "세종문화회관";
    const description = page?.description || venue?.description || notice?.date;
    const category = path === "/programs/performance" ? "공연" : path === "/programs/exhibition" ? "전시" : path.startsWith("/programs/education") ? "교육" : null;
    const collection = path === "/search" ? catalog.programs.filter(item => `${item.title} ${item.genre} ${item.venue}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
        : category ? catalog.programs.filter(item => item.category === category)
        : path.startsWith("/programs/season") ? catalog.programs.filter(item => item.tags?.includes("세종시즌")) : [];

    function blocks(items: PageContentBlock[]) {
        return items.map((block, index) => {
            if (block.type === "prose") return <section key={index} className="catalog-content-block">{block.heading && <h2 data-text="heading">{block.heading}</h2>}{block.paragraphs.map((paragraph, i) => <p data-text="body" key={i}>{paragraph}</p>)}</section>;
            if (block.type === "facts") return <section key={index} className="catalog-content-block">{block.title && <h2 data-text="heading">{block.title}</h2>}<dl className="page-layout-facts">{block.items.map(item => <div key={item.label}><dt data-text="label">{item.label}</dt><dd data-text="body">{item.value}</dd></div>)}</dl></section>;
            if (block.type === "faq") return <section key={index} className="catalog-content-block">{block.title && <h2 data-text="heading">{block.title}</h2>}{block.items.map(item => <SystemDisclosure key={item.question} summary={item.question}><p data-text="body">{item.answer}</p></SystemDisclosure>)}</section>;
            if (block.type === "timeline") return <section key={index} className="catalog-content-block">{block.title && <h2 data-text="heading">{block.title}</h2>}<ol className="catalog-timeline">{block.items.map(item => <li key={`${item.date}-${item.title}`}><time data-text="label">{item.date}</time><h3 data-text="subheading">{item.title}</h3>{item.body && <p data-text="body">{item.body}</p>}</li>)}</ol></section>;
            if (block.type === "map") return <SystemSurface key={index} variant="inset" padding="lg"><p data-text="label">{block.address}</p><SystemLink href={block.href} target="_blank" rel="noreferrer">{block.label}</SystemLink></SystemSurface>;
            if (block.type === "downloads") return <section key={index} className="catalog-content-block">{block.title && <h2 data-text="heading">{block.title}</h2>}<div className="page-layout-actions">{block.items.map(item => <SystemLink key={item.href} href={item.href} variant="secondary" target="_blank" rel="noreferrer">{item.label}</SystemLink>)}</div></section>;
            return <div key={index} className="page-layout-actions catalog-page-actions">{block.items.map(item => <SystemLink key={`${item.href}-${item.label}`} href={item.href} variant="secondary" target={item.external || item.href.startsWith("http") ? "_blank" : undefined} rel={item.external || item.href.startsWith("http") ? "noreferrer" : undefined}>{item.label}</SystemLink>)}</div>;
        });
    }

    return <div className="container page-layout catalog-page" data-component-id="catalog-page">
        <nav className="page-layout-breadcrumbs" aria-label="현재 위치"><Link data-text="action" href="/">홈</Link>{group && <><span data-text="body" aria-hidden="true">/</span><Link data-text="action" href={group.path}>{group.title}</Link></>}<span data-text="body" aria-hidden="true">/</span><span data-text="body" aria-current="page">{title}</span></nav>
        <header className="page-layout-heading catalog-page-heading"><h1 data-text="title">{title}</h1><p data-text="body">{description}</p>{group && <SystemControlGroup as="nav" className="catalog-page-navigation" aria-label={`${group.title} 메뉴`}>{group.items.map(([label, href]) => <SystemLink key={href} href={href} variant={path === href ? "primary" : "secondary"} aria-current={path === href ? "page" : undefined}>{label}</SystemLink>)}</SystemControlGroup>}</header>
        <div data-text="body" className="catalog-page-content">
            {path === "/search" && <DeepSearch initialQuery={query} />}
            {path === "/search" && <SystemField label="프로그램 빠른 필터" value={query} onChange={event => { const value = event.currentTarget.value; setQuery(value); window.history.replaceState(null, "", `?q=${encodeURIComponent(value)}`); }} placeholder="프로그램 이름, 장르, 공간" type="search" />}
            {(category || path.startsWith("/programs/season") || path === "/search") && <section className="catalog-content-block" aria-label="프로그램 목록"><p data-text="meta">{collection.length}개 프로그램</p><div className="programs-page-grid">{collection.map(program => <ProgramCard key={program.id} program={program} />)}</div>{!collection.length && <SystemNotice>현재 이 분류에 공개된 프로그램이 없습니다.</SystemNotice>}</section>}
            {(path === "/visit/spaces" || path === "/rental/venues" || path === "/rental/compare") && <div className="catalog-space-grid">{catalog.venues.map(item => <SystemSurface key={item.id} padding="lg"><h2 data-text="subheading">{item.name}</h2><p data-text="body">{item.description}</p><p data-text="meta">수용 규모 {item.capacity}{typeof item.capacity === "number" ? "석" : ""}</p><SystemLink href={`${path.startsWith("/rental") ? "/rental/venues" : "/visit/spaces"}/${item.id}`} variant="secondary">공간 상세</SystemLink></SystemSurface>)}</div>}
            {(path === "/news" || path === "/news/notices") && <div className="catalog-content-block">{catalog.notices.map(item => <SystemSurface key={item.id} padding="lg"><p data-text="meta">{item.category} · {item.date}</p><Link data-text="subheading" href={`/news/notices/${item.id}`}>{item.title}</Link></SystemSurface>)}</div>}
            {venue && <div data-text="body" className="page-layout-prose"><h2 data-text="heading">공간 정보</h2><dl className="page-layout-facts"><div><dt data-text="label">수용 규모</dt><dd data-text="body">{venue.capacity}{typeof venue.capacity === "number" ? "석" : ""}</dd></div><div><dt data-text="label">위치</dt><dd data-text="body">{venue.location || "세종문화회관"}</dd></div></dl>{venue.features?.map(item => <p data-text="body" key={item}>{item}</p>)}<SystemLink href="https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200368" variant="secondary" target="_blank" rel="noreferrer">공간·객석 배치 확인</SystemLink></div>}
            {notice && <article className="page-layout-prose"><p data-text="meta">{notice.category} · {notice.date}</p><p data-text="body">{notice.content || notice.body}</p>{notice.details && <dl className="page-layout-facts">{notice.details.map(([label, value]) => <div key={label}><dt data-text="label">{label}</dt><dd data-text="body">{value}</dd></div>)}</dl>}<SystemLink href="https://www.sejongpac.or.kr/portal/bbs/B0000058/list.do?menuNo=200568" target="_blank" rel="noreferrer">기관 공지 원문 확인</SystemLink></article>}
            {page && <div data-text="body" className="page-layout-prose">{blocks(page.blocks)}</div>}
            {page?.sourceUrl && <p data-text="meta" className="catalog-content-source"><a data-text="action" href={page.sourceUrl} target="_blank" rel="noreferrer">업무별 최신 안내 확인</a></p>}
        </div>
    </div>;
}
