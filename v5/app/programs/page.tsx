"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCatalog } from "../../src/catalog/CatalogProvider";
import ProgramCard from "../../components/ProgramCard";
import DeepSearchDisclosure from "../../components/DeepSearchDisclosure";
import { contextSearchReply } from "../../components/DeepSearch";
import { SystemField, SystemFilterButton } from "../../components/SystemPrimitives";
import type { Program } from "../../types/sejong.ts";

// [넓은 지면의 프로그램 탐색 / Program discovery across the shared page frame]
export default function ProgramsPage() {
    const { catalog } = useCatalog();
    const PROGRAMS = catalog.programs;
    const [category, setCategory] = useState<string>("전체");
    const [search, setSearch] = useState<string>("");

    const categories = ["전체", "공연", "전시", "교육"];

    const filtered = (PROGRAMS as unknown as Program[]).filter((p) => {
        const matchCat = category === "전체" || p.category === category;
        const matchSearch = !search.trim() || [p.title, p.genre || "", p.venue || "", p.description || ""].join(" ").toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div data-text="body" className="container page-layout programs-page">
            <nav className="page-layout-breadcrumbs" aria-label="현재 위치">
                <Link data-text="action" href="/">홈</Link>
                <span data-text="body" aria-hidden="true">/</span>
                <span data-text="body" aria-current="page">프로그램 전체보기</span>
            </nav>

            <header className="page-layout-heading">
                <h1 data-text="title">
                    세종의 프로그램
                </h1>
                <p data-text="body">
                    공연과 전시, 예술교육 프로그램의 일정과 장소를 확인하세요.
                </p>
            </header>

            {/* [공통 범주 필터와 검색 / Shared category filters and search] */}
            <div className="programs-page-controls">
                <div data-text="body" className="page-layout-actions" role="group" aria-label="프로그램 분류">
                    {categories.map((cat) => (
                        <SystemFilterButton data-text="action"
                            key={cat}
                            selected={category === cat}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </SystemFilterButton>
                    ))}
                </div>

                <div className="programs-page-search">
                    <SystemField data-text="body"
                        id="program-query"
                        label="프로그램 검색"
                        labelHidden
                        type="search"
                        placeholder="공연명, 장르, 공연장 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <DeepSearchDisclosure
                title="대화로 공연·전시·교육 검색"
                onSearch={term => contextSearchReply(term,
                    PROGRAMS.map(program => ({
                        title: program.title,
                        description: [program.genre, program.venue, program.description].filter(Boolean).join(" · "),
                        href: "/v5/programs/" + encodeURIComponent(program.id) + "/",
                    })),
                    "프로그램",
                )}
            />

            {/* [남는 폭에 맞춰 늘어나는 카드 목록 / Cards that follow the available width] */}
            {filtered.length > 0 ? (
                <div data-text="body" className="programs-page-grid">
                    {filtered.map((program) => (
                        <ProgramCard key={program.id} program={program} />
                    ))}
                </div>
            ) : (
                <div className="page-layout-empty" role="status">
                    <h2 data-text="heading">
                        검색 결과가 없습니다
                    </h2>
                    <p data-text="body">
                        다른 검색어를 입력하시거나 카테고리 필터를 변경해 보세요.
                    </p>
                </div>
            )}
        </div>
    );
}
