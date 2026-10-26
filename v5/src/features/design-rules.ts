// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { esc, href, icon, toast } from "../lib/core.ts";
import { pageHeader } from "../components/ui.ts";

// Anime.js 동적 임포트 및 펄스 인터랙션
let animeModule = null;
async function getAnime() {
    if (animeModule) return animeModule;
    try {
        const mod = await import("animejs");
        animeModule = mod.default || mod;
        return animeModule;
    } catch (e) {
        console.warn("Anime.js loading fallback:", e);
        return null;
    }
}

/**
 * 01. Primitives Data Definition
 * 기존 세종문화회관 고유의 상징색(천·지·인)과
 * 눈을 찌르는 원색을 배제하고 품격 있게 정제된 소프트/딥 틴트 셰이드 체계
 */
const PRIMITIVES = [
    // [A] 기존 세종문화회관 역사적 상징색 (Heritage)
    { group: "Heritage (원색)", origin: "기존 브랜드", name: "heritage/cheon", hex: "#54C8E8", desc: "천(天) - 맑고 청명한 세종의 하늘빛 원색" },
    { group: "Heritage (원색)", origin: "기존 브랜드", name: "heritage/ji", hex: "#C36D15", desc: "지(地) - 유구한 대지와 무대의 품격 원색" },
    { group: "Heritage (원색)", origin: "기존 브랜드", name: "heritage/in", hex: "#FFE800", desc: "인(人) - 시민과 예술가의 생명력 원색 (황금빛)" },

    // [B] 새롭게 제안한 연한 파스텔 틴트 셰이드 (Heritage Tints - 원색 완화)
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "cheon/tint-50", hex: "#F0F9FF", desc: "천(天)의 가장 연한 하늘빛 틴트 (배경·태그용)" },
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "cheon/tint-100", hex: "#E0F2FE", desc: "천(天)의 소프트 스카이 틴트 (경계·선택 영역)" },
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "ji/tint-50", hex: "#FFF7ED", desc: "지(地)의 부드러운 웜 크림 틴트 (배경용)" },
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "ji/tint-100", hex: "#FFEDD5", desc: "지(地)의 은은한 테라코타 틴트" },
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "in/tint-50", hex: "#FEFCE8", desc: "인(人)의 가장 은은한 레몬 밀크 틴트 (배경용)" },
    { group: "Heritage Tints (연한 톤)", origin: "신규 제안", name: "in/tint-100", hex: "#FEF9C3", desc: "인(人)의 부드러운 파스텔 옐로우 (배지용)" },

    // [C] 60% 중립색 (Neutrals - 눈의 피로를 던 웜/쿨 슬레이트)
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/white", hex: "#FFFFFF", desc: "순백 (Canvas & Card Surface)" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/paper-subtle", hex: "#F8FAFC", desc: "차분하고 은은한 서브 컨테이너 배경" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/border-subtle", hex: "#F1F5F9", desc: "미세한 섹션 분할선" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/border-default", hex: "#E2E8F0", desc: "카드 테두리 및 기본 경계선" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/text-muted", hex: "#64748B", desc: "보조 설명 텍스트 (대비 4.5:1 이상 확보)" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/text-secondary", hex: "#334155", desc: "부제목 및 2차 정보" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "neutral/text-primary", hex: "#0F172A", desc: "깊은 먹색 본문 (WCAG AAA 15:1 최고 가독성)" },
    { group: "Neutrals (중립색)", origin: "신규 제안", name: "primary/stage-black", hex: "#18181B", desc: "대극장 무대의 묵직한 스테이지 블랙" },

    // [D] 세련된 시맨틱 피드백 (Semantic Refined - 찌르는 원색 지양, 기품 있는 톤)
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/error-deep", hex: "#B91C1C", desc: "와인빛이 감도는 기품 있는 딥 레드 (오류 텍스트)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/error-subtle", hex: "#FEF2F2", desc: "눈이 편안한 은은한 소프트 레드 틴트 (오류 배경)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/error-border", hex: "#FECACA", desc: "부드러운 오류 테두리" },

    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/warning-deep", hex: "#C2410C", desc: "차분한 웜 테라코타 오렌지 (주의 텍스트)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/warning-subtle", hex: "#FFF7ED", desc: "따뜻하고 연한 살구빛 틴트 (주의 배경)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/warning-border", hex: "#FED7AA", desc: "부드러운 주의 테두리" },

    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/success-deep", hex: "#15803D", desc: "신뢰감 넘치는 딥 포레스트 그린 (성공 텍스트)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/success-subtle", hex: "#F0FDF4", desc: "연하고 산뜻한 소프트 민트 틴트 (성공 배경)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/success-border", hex: "#BBF7D0", desc: "부드러운 성공 테두리" },

    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/info-deep", hex: "#0369A1", desc: "천(天)과 어우러지는 정제된 덜블루 (안내 텍스트)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/info-subtle", hex: "#F0F9FF", desc: "맑고 투명한 하늘빛 틴트 (안내 배경)" },
    { group: "Refined Semantic (상태)", origin: "신규 제안", name: "status/info-border", hex: "#BAE6FD", desc: "부드러운 안내 테두리" },
];

/**
 * 02. Semantic Variables Definition
 * 실제 UI에서 역할을 정의하며, Primitives 변수와 Alias로 연결
 */
const SEMANTICS = [
    // Background
    { group: "Background", name: "bg/canvas", primitive: "neutral/white", hex: "#FFFFFF", desc: "전체 화면 메인 캔버스 배경" },
    { group: "Background", name: "bg/subtle", primitive: "neutral/paper-subtle", hex: "#F8FAFC", desc: "섹션 전환 및 서브 컨테이너 표면 배경" },
    { group: "Background", name: "bg/highlight", primitive: "in/tint-50", hex: "#FEFCE8", desc: "추천 프로그램 및 이벤트 하이라이트 배경" },

    // Surface & Card
    { group: "Surface", name: "surface/card", primitive: "neutral/white", hex: "#FFFFFF", desc: "공연/전시 포스터 카드 및 정보 카드 기본 표면" },
    { group: "Surface", name: "surface/hero-dark", primitive: "primary/stage-black", hex: "#18181B", desc: "메인 배너 및 다크 오버레이 표면" },

    // Text & Content
    { group: "Text", name: "text/primary", primitive: "neutral/text-primary", hex: "#0F172A", desc: "핵심 제목 및 본문 (가독성 15:1 최고 등급)" },
    { group: "Text", name: "text/secondary", primitive: "neutral/text-secondary", hex: "#334155", desc: "보조 헤드라인 및 일반 설명" },
    { group: "Text", name: "text/muted", primitive: "neutral/text-muted", hex: "#64748B", desc: "날짜, 장소, 보조 캡션 (대비 4.5:1 이상 보장)" },
    { group: "Text", name: "text/inverse", primitive: "neutral/white", hex: "#FFFFFF", desc: "어두운 배경 및 다크 버튼 위 텍스트" },

    // Border & Divider
    { group: "Border", name: "border/default", primitive: "neutral/border-default", hex: "#E2E8F0", desc: "카드 외곽선 및 패널 테두리" },
    { group: "Border", name: "border/subtle", primitive: "neutral/border-subtle", hex: "#F1F5F9", desc: "테이블 행 분할 및 미세 구분선" },

    // Action & Buttons
    { group: "Action", name: "action/primary", primitive: "primary/stage-black", hex: "#18181B", desc: "주요 예매·신청 완료 핵심 버튼" },
    { group: "Action", name: "action/interactive", primitive: "status/info-deep", hex: "#0369A1", desc: "텍스트 링크 및 활성 포커스 링" },

    // Accent Point
    { group: "Accent", name: "accent/human-gold", primitive: "heritage/in", hex: "#FFE800", desc: "세종 시그니처 인(人) 황금빛 포인트 배지" },
    { group: "Accent", name: "accent/sky-touch", primitive: "heritage/cheon", hex: "#54C8E8", desc: "천(天)의 맑은 예술적 터치 포인트" },

    // Semantic Status (Refined Muted)
    { group: "Status - Error", name: "feedback/error-text", primitive: "status/error-deep", hex: "#B91C1C", desc: "경고 및 오류 메시지 글자색" },
    { group: "Status - Error", name: "feedback/error-bg", primitive: "status/error-subtle", hex: "#FEF2F2", desc: "경고 및 오류 박스 배경색 (연한 틴트)" },
    { group: "Status - Error", name: "feedback/error-border", primitive: "status/error-border", hex: "#FECACA", desc: "경고 및 오류 박스 테두리색" },

    { group: "Status - Success", name: "feedback/success-text", primitive: "status/success-deep", hex: "#15803D", desc: "예매/접수 완료 텍스트 글자색" },
    { group: "Status - Success", name: "feedback/success-bg", primitive: "status/success-subtle", hex: "#F0FDF4", desc: "예매/접수 완료 안내 박스 배경색 (연한 틴트)" },
    { group: "Status - Success", name: "feedback/success-border", primitive: "status/success-border", hex: "#BBF7D0", desc: "예매/접수 완료 박스 테두리색" },

    { group: "Status - Warning", name: "feedback/warning-text", primitive: "status/warning-deep", hex: "#C2410C", desc: "마감 임박 및 주의 안내 글자색" },
    { group: "Status - Warning", name: "feedback/warning-bg", primitive: "status/warning-subtle", hex: "#FFF7ED", desc: "주의 안내 박스 배경색 (연한 틴트)" },
];

export function renderDesignRules() {
    return `
    <div class="design-rules-page">
        ${pageHeader({
            title: "디자인 시스템 & 정제된 컬러 규칙",
            eyebrow: "SEJONG DESIGN SYSTEM V5",
            description: "원색의 자극을 지양하고, 천지인 삼재의 고유성과 연한 틴트 셰이드로 완성한 품격 있는 문화예술 팔레트.",
            group: "rules",
            path: "/design-rules"
        })}
        
        <div class="container page-content" style="max-width:1120px;margin:0 auto;padding-bottom:5rem;">
            <!-- 버전별 디자인 설계 규칙 퀵 탐색 카드 -->
            <section class="version-nav-section" style="margin-bottom:3.5rem;">
                <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;color:#0f172a;">버전별 디자인 설계 규칙 탐색</h2>
                <div class="version-rule-cards" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;">
                    <a href="design-qa.md" class="rule-nav-card" style="display:block;padding:1.2rem;background:#f3f4f5;border-radius:12px;text-decoration:none;color:#1e293b;border:1px solid #e2e8f0;transition:all 0.2s;">
                        <span style="font-size:0.75rem;font-weight:700;color:#64748b;">LEGACY & COMMON</span>
                        <h3 style="font-size:1rem;margin:0.4rem 0;font-weight:700;">플랫 스타일 검수</h3>
                        <p style="font-size:0.825rem;color:#64748b;margin:0;">그림자 제거 및 평면 표기 기준</p>
                    </a>
                    <a href="v2/docs/design-system.md" class="rule-nav-card" style="display:block;padding:1.2rem;background:#fff8db;border-radius:12px;text-decoration:none;color:#1e293b;border:1px solid #fde047;transition:all 0.2s;">
                        <span style="font-size:0.75rem;font-weight:700;color:#854d0e;">V2 DESIGN</span>
                        <h3 style="font-size:1rem;margin:0.4rem 0;font-weight:700;">v2 가독성 기본값</h3>
                        <p style="font-size:0.825rem;color:#713f12;margin:0;">16px 최소 크기 및 캡슐형 피드백</p>
                    </a>
                    <a href="v4/docs/interaction-plan.md" class="rule-nav-card" style="display:block;padding:1.2rem;background:#eff6ff;border-radius:12px;text-decoration:none;color:#1e293b;border:1px solid #bfdbfe;transition:all 0.2s;">
                        <span style="font-size:0.75rem;font-weight:700;color:#1d4ed8;">V4 INTERACTION</span>
                        <h3 style="font-size:1rem;margin:0.4rem 0;font-weight:700;">v4 인터랙션 설계</h3>
                        <p style="font-size:0.825rem;color:#1e40af;margin:0;">방문 여정 및 모션 피드백</p>
                    </a>
                    <div class="rule-nav-card is-active" style="padding:1.2rem;background:#0f172a;border-radius:12px;color:#ffffff;border:2px solid #54c8e8;">
                        <span style="font-size:0.75rem;font-weight:700;color:#54c8e8;">V5 NEXT.JS</span>
                        <h3 style="font-size:1rem;margin:0.4rem 0;font-weight:700;">v5 정제된 컬러 시스템 (현재)</h3>
                        <p style="font-size:0.825rem;color:#94a3b8;margin:0;">원색 지양 · 연한 틴트 · Figma 토큰</p>
                    </div>
                </div>
            </section>

            <!-- 1. 브랜드 아이덴티티 및 원색 지양 설계 전략 -->
            <section class="brand-philosophy-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:2rem;margin-bottom:3rem;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                    <span style="display:inline-block;width:12px;height:12px;background:#c36d15;border-radius:50%;"></span>
                    <h2 style="font-size:1.5rem;font-weight:700;margin:0;color:#0f172a;">1. 브랜드 아이덴티티 분석 & 원색 지양 설계 전략</h2>
                </div>
                <p style="color:#475569;line-height:1.75;font-size:1.025rem;">
                    세종문화회관 고유의 <strong>천·지·인(天地人) 핵심 상징</strong>은 유지하되, 
                    <strong>웹 UI에서 눈을 찌르는 순수 원색(Primary Red/Green/Blue/Yellow)의 직접 노출을 지양</strong>합니다.<br>
                    배경과 카드 표면에는 <strong>우아하고 연한 파스텔 틴트(50~100 셰이드)</strong>를, 
                    상태 텍스트에는 <strong>차분하고 깊이 있는 딥 톤(Deep Tone)</strong>을 매칭하여 
                    공공 문화예술기관다운 절제된 품격과 WCAG AAA 가독성을 동시 달성했습니다.
                </p>

                <!-- 기존 컬러 vs 신규 제안 비교 요약 -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem;margin-top:1.5rem;">
                    <div style="padding:1.25rem;background:#fff8db;border-radius:12px;border:1px solid #fde047;">
                        <span style="font-size:0.8rem;font-weight:700;color:#854d0e;display:block;margin-bottom:0.4rem;">HERITAGE (기존 브랜드 컬러 유지)</span>
                        <h3 style="font-size:1.05rem;font-weight:700;color:#713f12;margin:0 0 0.5rem 0;">천·지·인 삼재 원본값 보존</h3>
                        <p style="font-size:0.875rem;color:#713f12;line-height:1.6;margin:0;">
                            <strong>천(天) #54C8E8 · 지(地) #C36D15 · 인(人) #FFE800</strong><br>
                            기관의 역사성과 상징성을 온전히 보존하며, 상징 로고 및 10% 이내의 시그니처 배지에만 한정적으로 적용합니다.
                        </p>
                    </div>
                    <div style="padding:1.25rem;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                        <span style="font-size:0.8rem;font-weight:700;color:#15803d;display:block;margin-bottom:0.4rem;">NEW PROPOSALS (신규 제안: 틴트 & 소프트 셰이드)</span>
                        <h3 style="font-size:1.05rem;font-weight:700;color:#14532d;margin:0 0 0.5rem 0;">원색 지양 상태 피드백 & 연한 배경 틴트</h3>
                        <p style="font-size:0.875rem;color:#14532d;line-height:1.6;margin:0;">
                            <strong>오류: 와인레드 #B91C1C + 연한 핑크틴트 #FEF2F2</strong><br>
                            <strong>성공: 포레스트 #15803D + 연한 민트틴트 #F0FDF4</strong><br>
                            자극적인 원색 경고창을 없애고, 눈이 편안한 파스텔 틴트 박스로 사용자 스트레스를 대폭 줄였습니다.
                        </p>
                    </div>
                </div>
            </section>

            <!-- 2. 시각적 인터랙티브 컬러 팔레트 (Anime.js 연동) -->
            <section style="margin-bottom:3.5rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <h2 style="font-size:1.5rem;font-weight:700;margin:0;color:#0f172a;">2. 시각적 정제 컬러 팔레트 & 컬러칩</h2>
                        <p style="color:#64748b;font-size:0.95rem;margin:0.25rem 0 0 0;">각 컬러칩을 클릭하면 부드러운 애니메이션과 함께 HEX 코드가 복사됩니다.</p>
                    </div>
                    <button class="button button--outline" type="button" data-animate-palette style="font-size:0.875rem;">
                        ${icon("sparkles", 18)} 팔레트 모션 재생
                    </button>
                </div>

                <div class="palette-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:1rem;">
                    ${PRIMITIVES.map((p) => `
                        <div class="interactive-color-card" data-color="${p.hex}" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;">
                            <div class="color-swatch-box" style="height:76px;background:${p.hex};border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:flex-end;justify-content:space-between;padding:0.4rem 0.6rem;">
                                <span style="font-size:0.65rem;font-weight:700;background:${p.origin === "기존 브랜드" ? "#fef08a" : "rgba(255,255,255,0.9)"};color:#0f172a;padding:0.1rem 0.35rem;border-radius:3px;">${p.origin}</span>
                                <span style="font-size:0.75rem;font-weight:700;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);padding:0.15rem 0.4rem;border-radius:4px;color:#0f172a;">${p.hex}</span>
                            </div>
                            <div style="padding:0.75rem;">
                                <div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">${p.group}</div>
                                <div style="font-size:0.85rem;font-weight:700;color:#0f172a;margin:0.2rem 0;">${p.name}</div>
                                <div style="font-size:0.75rem;color:#475569;line-height:1.4;">${p.desc}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </section>

            <!-- 3. Figma Variables: 01. Primitives Collection 표 -->
            <section style="margin-bottom:3.5rem;">
                <div style="margin-bottom:1rem;">
                    <span style="font-size:0.85rem;font-weight:700;color:#0284c7;background:#e0f2fe;padding:0.25rem 0.6rem;border-radius:999px;">Collection 01</span>
                    <h2 style="font-size:1.4rem;font-weight:700;margin:0.5rem 0 0.2rem 0;color:#0f172a;">Figma Variables: 01. Primitives</h2>
                    <p style="color:#64748b;font-size:0.925rem;margin:0;">Figma의 Primitives 컬렉션에 1:1로 등록할 원본 토큰 표입니다 (기존 컬러 vs 신규 제안 구분 명시).</p>
                </div>
                <div class="info-table-wrap" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow-x:auto;">
                    <table class="info-table" style="width:100%;border-collapse:collapse;text-align:left;font-size:0.875rem;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                                <th style="padding:0.85rem 1rem;">컬러칩</th>
                                <th style="padding:0.85rem 1rem;">구분</th>
                                <th style="padding:0.85rem 1rem;">그룹</th>
                                <th style="padding:0.85rem 1rem;">변수명 (Variable Name)</th>
                                <th style="padding:0.85rem 1rem;">HEX 코드</th>
                                <th style="padding:0.85rem 1rem;">특성 및 사용 목적</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${PRIMITIVES.map(p => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.65rem 1rem;"><span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:${p.hex};border:1px solid rgba(0,0,0,0.1);vertical-align:middle;"></span></td>
                                    <td style="padding:0.65rem 1rem;"><span style="font-size:0.75rem;padding:0.15rem 0.4rem;border-radius:4px;background:${p.origin === "기존 브랜드" ? "#fef9c3" : "#f1f5f9"};color:#0f172a;font-weight:600;">${p.origin}</span></td>
                                    <td style="padding:0.65rem 1rem;color:#64748b;">${p.group}</td>
                                    <td style="padding:0.65rem 1rem;font-family:monospace;font-weight:700;color:#0284c7;">${p.name}</td>
                                    <td style="padding:0.65rem 1rem;font-family:monospace;font-weight:600;">${p.hex}</td>
                                    <td style="padding:0.65rem 1rem;color:#334155;">${p.desc}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- 4. Figma Variables: 02. Semantic Collection 표 -->
            <section style="margin-bottom:3.5rem;">
                <div style="margin-bottom:1rem;">
                    <span style="font-size:0.85rem;font-weight:700;color:#15803d;background:#dcfce7;padding:0.25rem 0.6rem;border-radius:999px;">Collection 02</span>
                    <h2 style="font-size:1.4rem;font-weight:700;margin:0.5rem 0 0.2rem 0;color:#0f172a;">Figma Variables: 02. Semantic (Alias 연동)</h2>
                    <p style="color:#64748b;font-size:0.925rem;margin:0;">HEX 중복 없이 Primitives와 1:1 연결되는 UI 역할 중심의 시맨틱 토큰입니다.</p>
                </div>
                <div class="info-table-wrap" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow-x:auto;">
                    <table class="info-table" style="width:100%;border-collapse:collapse;text-align:left;font-size:0.875rem;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                                <th style="padding:0.85rem 1rem;">역할 구분</th>
                                <th style="padding:0.85rem 1rem;">변수명 (Variable Name)</th>
                                <th style="padding:0.85rem 1rem;">연결할 Primitive (Alias)</th>
                                <th style="padding:0.85rem 1rem;">실제 HEX</th>
                                <th style="padding:0.85rem 1rem;">UI 사용 목적</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${SEMANTICS.map(s => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.65rem 1rem;font-weight:600;color:#0f172a;">${s.group}</td>
                                    <td style="padding:0.65rem 1rem;font-family:monospace;font-weight:700;color:#0f172a;">${s.name}</td>
                                    <td style="padding:0.65rem 1rem;"><span style="font-family:monospace;background:#f1f5f9;padding:0.2rem 0.5rem;border-radius:4px;color:#0284c7;font-weight:600;">{${s.primitive}}</span></td>
                                    <td style="padding:0.65rem 1rem;font-family:monospace;color:#64748b;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${s.hex};margin-right:6px;vertical-align:middle;border:1px solid rgba(0,0,0,0.1);"></span>${s.hex}</td>
                                    <td style="padding:0.65rem 1rem;color:#334155;">${s.desc}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- 5. 원색 지양 정제 컬러 실제 UI 적용 컴포넌트 쇼케이스 -->
            <section style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:2rem;">
                <h2 style="font-size:1.4rem;font-weight:700;margin:0 0 0.5rem 0;color:#0f172a;">5. 실제 UI 적용 예시 (원색을 배제한 소프트 피드백)</h2>
                <p style="color:#64748b;font-size:0.95rem;margin:0 0 1.5rem 0;">눈부신 형광 빨강/초록 대신 연한 틴트 배경과 딥 톤 텍스트로 완성된 고품격 인터페이스입니다.</p>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.5rem;">
                    <!-- 예시 1: 성공 피드백 카드 (연한 틴트 #F0FDF4 + 딥 그린 #15803D) -->
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:1.5rem;">
                        <div style="display:flex;align-items:center;gap:0.5rem;color:#15803d;font-weight:700;margin-bottom:0.75rem;">
                            ${icon("check", 20)}
                            <span>체험 예매가 정상적으로 완료되었습니다</span>
                        </div>
                        <p style="font-size:0.9rem;color:#166534;line-height:1.6;margin:0 0 1rem 0;">
                            자극적인 원색 대신 <strong>소프트 민트 틴트</strong> 배경을 사용하여 관람객의 마음에 편안한 안정감을 제공합니다.
                        </p>
                        <span style="font-size:0.8rem;color:#15803d;background:#dcfce7;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;">
                            피드백 토큰: feedback/success-bg (#F0FDF4)
                        </span>
                    </div>

                    <!-- 예시 2: 오류 피드백 카드 (연한 틴트 #FEF2F2 + 와인 레드 #B91C1C) -->
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:1.5rem;">
                        <div style="display:flex;align-items:center;gap:0.5rem;color:#b91c1c;font-weight:700;margin-bottom:0.75rem;">
                            ${icon("close", 20)}
                            <span>예매 인원 정원을 초과했습니다</span>
                        </div>
                        <p style="font-size:0.9rem;color:#991b1b;line-height:1.6;margin:0 0 1rem 0;">
                            눈을 찌르는 순수 빨강(#FF0000)을 지양하고, <strong>정제된 와인 레드</strong>와 연한 핑크 틴트 테두리로 품격 있게 안내합니다.
                        </p>
                        <span style="font-size:0.8rem;color:#b91c1c;background:#fee2e2;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;">
                            피드백 토큰: feedback/error-bg (#FEF2F2)
                        </span>
                    </div>

                    <!-- 예시 3: 인(人) 황금빛 시그니처 배지 카드 -->
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                            <span style="background:#fef9c3;color:#854d0e;border:1px solid #fef08a;font-weight:700;font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:4px;">
                                인(人) 소프트 틴트 배지
                            </span>
                            <span style="font-size:0.85rem;color:#64748b;">세종대극장</span>
                        </div>
                        <h3 style="font-size:1.15rem;font-weight:700;color:#0f172a;margin:0 0 0.5rem 0;">가을의 리듬, 서울의 울림</h3>
                        <p style="font-size:0.875rem;color:#64748b;line-height:1.5;margin:0 0 1rem 0;">
                            기존 인(人)의 노란색을 연하게 정제한 <strong>#FEF9C3</strong>를 배지에 사용하여 가독성과 세련됨을 극대화했습니다.
                        </p>
                        <button class="button button--dark flow-button-full" type="button" style="padding:0.6rem;">
                            프로그램 상세보기 ${icon("arrow", 16)}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </div>
    `;
}

export function bindDesignRules(root) {
    if (!root) return;

    // Anime.js를 활용한 컬러칩 클릭 탄성 펄스 인터랙션
    const cards = root.querySelectorAll(".interactive-color-card");
    cards.forEach((card) => {
        card.addEventListener("click", () => {
            const hex = card.dataset.color;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(hex);
                toast(`컬러 코드 ${hex}가 클립보드에 복사되었습니다.`);
            }
            getAnime().then((anime) => {
                if (anime) {
                    anime({
                        targets: card,
                        scale: [1, 0.93, 1.04, 1],
                        duration: 380,
                        easing: "easeOutElastic(1, .6)",
                    });
                }
            });
        });
    });

    // 팔레트 모션 재생
    root.querySelector("[data-animate-palette]")?.addEventListener("click", () => {
        getAnime().then((anime) => {
            if (anime) {
                anime({
                    targets: ".interactive-color-card",
                    translateY: [24, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(30, { start: 40 }),
                    duration: 550,
                    easing: "easeOutCubic",
                });
            }
        });
    });
}
