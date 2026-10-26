"use client";

import React, { useState } from "react";
import { useCatalog } from "../../../src/catalog/CatalogProvider";
import Link from "next/link";
import type { Program } from "../../../types/sejong.ts";
import { mediaPath } from "../../../src/lib/media";
import { SystemBadge, SystemLink, SystemNotice } from "../../../components/SystemPrimitives";

interface ProgramDetailClientProps {
    program: Program;
}

// [원본 포스터와 읽기 영역의 관계 / Natural poster proportions beside readable details]
export default function ProgramDetailClient({ program: initialProgram }: ProgramDetailClientProps) {
    const { catalog, loading, error } = useCatalog();
    const program = catalog.programs.find(item => item.id === initialProgram.id) || initialProgram;
    const imagePath = mediaPath(program.image);
    const [imageFailed, setImageFailed] = useState(false);
    if (!loading && !error && !catalog.programs.some(item => item.id === initialProgram.id)) return <div className="container page-layout"><SystemNotice title="공개가 종료된 프로그램입니다"><SystemLink href="/programs/">프로그램 목록</SystemLink></SystemNotice></div>;

    return (
        <div className="container page-layout program-detail-page">
            <nav className="page-layout-breadcrumbs" aria-label="현재 위치">
                <Link data-text="action" href="/">홈</Link>
                <span data-text="body" aria-hidden="true">/</span>
                <Link data-text="action" href="/programs">프로그램</Link>
                <span data-text="body" aria-hidden="true">/</span>
                <span data-text="body" aria-current="page">{program.title}</span>
            </nav>

            <article className="program-detail-page-grid">
                <div className="program-detail-page-poster">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {program.image && !imageFailed ? <img
                        src={imagePath}
                        alt={program.imageAlt || program.title}
                        onError={() => setImageFailed(true)}
                    /> : <p data-text="body">공식 이미지 준비 중</p>}
                </div>

                <div className="program-detail-page-summary">
                    <header className="page-layout-heading">
                        <div className="page-layout-actions">
                            <SystemBadge data-text="meta" tone="info">{program.category}</SystemBadge>
                            <SystemBadge data-text="meta">{program.genre}</SystemBadge>
                        </div>
                        <h1 data-text="title">{program.title}</h1>
                    </header>

                    <dl className="page-layout-facts program-detail-page-facts">
                        <dt data-text="label">일시</dt>
                        <dd data-text="body">{program.start} ~ {program.end}</dd>
                        <dt data-text="label">장소</dt>
                        <dd data-text="body">{program.venue}</dd>
                        <dt data-text="label">가격</dt>
                        <dd data-text="body">
                            {typeof program.price === "number"
                                ? `${program.price.toLocaleString("ko-KR")}원`
                                : (program.price || "확인 중")}
                        </dd>
                        <dt data-text="label">시간</dt>
                        <dd data-text="body">{program.time || "확인 중"}</dd>
                    </dl>

                    <section className="page-layout-prose program-detail-page-description" aria-labelledby="program-description-heading">
                        <h2 data-text="heading" id="program-description-heading">프로그램 소개</h2>
                        <p data-text="body">{program.description}</p>
                    </section>

                    {/* [공통 예매 이동 조작 / Shared booking navigation actions] */}
                    <div className="page-layout-actions program-detail-page-actions">
                        <SystemLink data-text="action" context="flow" href={`/booking/${program.id}`}>
                            예약 회차 확인
                        </SystemLink>
                        <SystemLink data-text="action" context="flow" variant="secondary" href="/programs">
                            목록으로
                        </SystemLink>
                    </div>
                </div>
            </article>
        </div>
    );
}
