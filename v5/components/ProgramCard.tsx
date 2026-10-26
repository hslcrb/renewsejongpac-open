"use client";

import { SystemBadge, SystemIconButton } from "./SystemPrimitives";
import React from "react";
import Link from "next/link";
import type { Program } from "../types/sejong.ts";
import { showSmallNotification } from "./SmallNotificationModal";
import Icon from "./Icon";
import useFavorites from "./useFavorites";
import { toggleFavorite } from "../src/lib/favorites";
import { mediaPath } from "../src/lib/media";
import { useCatalog } from "../src/catalog/CatalogProvider";

interface ProgramCardProps {
    program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {
    const { catalog } = useCatalog();
    const hasVerifiedSession = catalog.sessions.some(session => session.programId === program.id && session.bookingEnabled && session.sourceState === "verified" && new Date(session.startsAt).valueOf() > Date.now());
    const isFavorite = useFavorites().includes(program.id);

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const { saved } = await toggleFavorite(program.id);
            showSmallNotification(saved ? "관심 프로그램에 저장했어요." : "관심 프로그램에서 삭제했어요.");
        } catch (error) {
            showSmallNotification(error instanceof Error ? error.message : "관심 프로그램을 저장하지 못했습니다.");
        }
    };

    // 포스터 이미지 경로 안전 취득
    const imagePath = mediaPath(program.image);

    const formatDate = (val?: string) => String(val || "").replaceAll("-", ".");

    return (
        <article data-component-id="poster" className="card card--poster program-card" data-card="poster">
            <Link data-text="action"
                href={`/programs/${program.id}`}
                className="card-poster-link"
                draggable={false}
                aria-label={`${program.title} 상세보기`}
            >
                <div className="poster-media program-art">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imagePath}
                        alt={program.image ? (program.imageAlt || program.title) : "세종문화회관 공간 사진"}
                        loading="lazy"
                        width={450}
                        height={600}
                        draggable={false}
                        onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = mediaPath();
                            }
                        }}
                    />
                    <SystemBadge data-text="meta" tone="info" className="poster-tag">
                        {program.category || "공연"}
                    </SystemBadge>
                </div>

                <div className="program-card-meta">
                    <span data-text="body">{program.genre || program.category}</span>
                    <span data-text="body">{hasVerifiedSession ? "예약 가능" : "일정 확인"}</span>
                </div>

                <h3 data-text="subheading">{program.title}</h3>

                <p data-text="caption" className="program-card-date">
                    {formatDate(program.start)} — {formatDate(program.end)}
                </p>

                <p data-text="body" className="program-card-venue">{program.venue}</p>
            </Link>

            <div className="card-poster-actions">
                <SystemIconButton data-text="action"
                    variant={isFavorite ? "highlight" : "secondary"}
                    type="button"
                    className={`favorite-button ${isFavorite ? "selected" : ""}`}
                    onClick={handleFavorite}
                    aria-pressed={isFavorite}
                    aria-label={`${program.title} 관심 프로그램 ${isFavorite ? "해제" : "등록"}`}
                >
                    <Icon name="heart" filled={isFavorite} size={24} />
                </SystemIconButton>
            </div>
        </article>
    );
}
