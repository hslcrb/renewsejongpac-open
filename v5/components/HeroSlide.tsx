"use client";

import type { HeroSlideLayout, HeroSlidePreview } from "../src/system/component-contracts";

import { Fragment } from "react";
import Icon from "./Icon";
import { SystemButton, SystemLink } from "./SystemPrimitives";
import { mediaPath } from "../src/lib/media";
import type { HomeFeature } from "../src/data/home-features";

// [작품 중심 히어로의 공통 규격 / Shared artwork-led hero slide]
export default function HeroSlide({ feature, active, entering = false, preview, onSelect, layout = "with-companion", idPrefix = "home-feature" }: {
    feature: HomeFeature;
    active: boolean;
    entering?: boolean;
    preview?: HeroSlidePreview;
    onSelect?: () => void;
    layout?: HeroSlideLayout;
    idPrefix?: string;
}) {
    return (
        <article
            className={`card card--hero season-slide season-${feature.theme}${active ? " is-active" : ""}${entering ? " is-entering" : ""}`}
            data-card="hero"
            data-component="HeroSlide" data-component-id="hero-slide"
            data-layout={layout}
            data-feature={feature.id}
            data-preview={preview}
            id={active ? `${idPrefix}-${feature.id}` : undefined}
            data-home-anchor={active ? "" : undefined}
            aria-hidden={!active && !preview}
        >
            <div data-text="body" className="season-card-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    className="season-image"
                    src={feature.image ? mediaPath(`assets/images/${feature.image}`) : mediaPath()}
                    alt={feature.image && feature.alt ? feature.alt : "세종문화회관 공간 사진"}
                    width={1672}
                    height={941}
                    draggable={false}
                    loading={active || preview ? "eager" : "lazy"}
                    onError={event => {
                        if (event.currentTarget.dataset.fallback) return;
                        event.currentTarget.dataset.fallback = "true";
                        event.currentTarget.src = mediaPath();
                        event.currentTarget.alt = "세종문화회관 공간 사진";
                    }}
                />
                <div className="season-copy" aria-hidden={!active}>
                    <p data-text="label" className="season-label">{feature.label}</p>
                    <h2 data-text="heading" data-text-size={layout === "standalone" ? "hero-standalone" : "hero-with-companion"}>{feature.title.split("\n").map((line, index, lines) => (
                        <Fragment key={index}>{line}{index < lines.length - 1 && <br />}</Fragment>
                    ))}</h2>
                    <p data-text="body" className="season-name">{feature.name}</p>
                    <p data-text="caption" className="season-meta">{feature.date}<span data-text="body">{feature.venue}</span></p>
                    <p data-text="body" className="season-description">{feature.description}</p>
                    <div className="season-actions">
                        <SystemLink data-text="action" variant="inverse" href={`/programs/${feature.id}`} tabIndex={active ? 0 : -1} draggable={false}>
                            상세보기 <Icon name="arrow" size={20} />
                        </SystemLink>
                        <SystemLink data-text="action" variant="inverse-outline" href={`/booking/${feature.id}`} tabIndex={active ? 0 : -1} draggable={false}>
                            예매하기 <Icon name="ticket" size={20} />
                        </SystemLink>
                    </div>
                </div>
                {preview && <SystemButton data-text="action"
                    variant="inverse-quiet"
                    className="season-peer-title"
                    aria-label={`${feature.name} ${preview === "previous" ? "이전" : "다음"} 슬라이드로 보기`}
                    onClick={onSelect}
                >
                    <Icon name={preview === "previous" ? "back" : "arrow"} size={24} />
                    <strong data-text="item-title">{feature.programTitle}</strong>
                </SystemButton>}
            </div>
        </article>
    );
}
