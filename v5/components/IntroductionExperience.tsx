"use client";

import { useEffect, useState } from "react";
import { SystemButton, SystemLink } from "./SystemPrimitives";
import SystemSurface from "./SystemSurface";
import "./introduction.css";

const scenes = [
    { id: "opening", label: "세종문화회관" },
    { id: "pulse", label: "서울시예술단" },
    { id: "space", label: "공연장과 전시장" },
    { id: "together", label: "관람 안내" },
] as const;

// [공연장 사진과 기관 정보로 읽는 소개 / An introduction grounded in venues and people]
export default function IntroductionExperience() {
    const [active, setActive] = useState<string>("opening");
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.introScene || "opening");
        }, { threshold: 0.45 });
        document.querySelectorAll("[data-intro-scene]").forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, []);
    function jump(id: string) {
        document.getElementById("intro-" + id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
    return <div className="sejong-intro" data-component-id="introduction">
        <nav className="intro-scenes container" aria-label="기관 소개 장면">{scenes.map(scene => <SystemButton key={scene.id} variant="quiet" aria-current={active === scene.id ? "step" : undefined} onClick={() => jump(scene.id)}>{scene.label}</SystemButton>)}</nav>
        <section id="intro-opening" data-intro-scene="opening" className="intro-panel intro-cover">
            <img src="/v5/assets/images/sejong-grand-facade.png" alt="광화문광장에 면한 세종문화회관 외관" width={1160} height={680} />
            <div className="intro-cover-copy container"><p data-text="label">1978년 개관</p><h1 data-text="title">광화문에서 만나는<br />세종문화회관</h1><p data-text="body">공연과 전시를 보고, 예술을 배우는 서울의 문화공간입니다.</p><SystemButton variant="inverse" onClick={() => jump("pulse")}>세종문화회관 둘러보기</SystemButton></div>
        </section>
        <section id="intro-pulse" data-intro-scene="pulse" className="intro-panel container intro-editorial">
            <div><p data-text="label">서울시예술단</p><h2 data-text="heading">무대를 만드는 사람들</h2><p data-text="body">국악, 무용, 합창, 뮤지컬, 연극과 오페라. 서울시예술단의 공연과 활동을 소개합니다.</p><SystemLink href="/about/companies" variant="secondary">서울시예술단 소개</SystemLink></div>
            <figure><img src="/v5/assets/images/official/ilmu-stage.jpg" alt="서울시무용단 일무의 공연 장면" width={1200} height={675} loading="lazy" /><figcaption data-text="meta">서울시무용단 〈일무〉</figcaption></figure>
        </section>
        <section id="intro-space" data-intro-scene="space" className="intro-panel container intro-editorial intro-editorial-reverse">
            <figure><img src="/v5/assets/images/sejong-grand-auditorium.png" alt="세종대극장의 객석과 무대" width={1160} height={680} loading="lazy" /><figcaption data-text="meta">세종대극장</figcaption></figure>
            <div><p data-text="label">공연장과 전시장</p><h2 data-text="heading">공간마다 다른 관람 경험</h2><p data-text="body">대극장과 체임버홀, M씨어터와 S씨어터, 미술관의 위치와 객석을 관람 전에 살펴보세요.</p><SystemLink href="/visit/spaces" variant="secondary">공간과 객석 안내</SystemLink></div>
        </section>
        <section id="intro-together" data-intro-scene="together" className="intro-panel container">
            <SystemSurface as="section" variant="subtle" padding="lg" className="intro-visit"><div><h2 data-text="heading">관람을 준비하세요</h2><p data-text="body">프로그램 일정과 찾아오는 길, 접근성 서비스를 안내합니다.</p></div><div className="page-layout-actions"><SystemLink href="/programs">프로그램 일정</SystemLink><SystemLink href="/visit/directions" variant="secondary">오시는 길</SystemLink><SystemLink href="/visit/accessibility" variant="secondary">접근성 안내</SystemLink><SystemLink href="/about/introduction/history" variant="quiet">연혁</SystemLink></div></SystemSurface>
        </section>
    </div>;
}
