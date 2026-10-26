"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import Icon from "../../components/Icon";
import ProgramCard from "../../components/ProgramCard";
import FloatingMenu from "../../components/FloatingMenu";
import LiquidGlassDemo from "./_documentation/LiquidGlassDemo";
import ComponentCatalog from "./_documentation/ComponentCatalog";
import SystemDialog from "../../components/SystemDialog";
import DeepSearchDisclosure from "../../components/DeepSearchDisclosure";
import { contextSearchReply } from "../../components/DeepSearch";
import { SystemText, textAttributes } from "../../components/SystemText";
import { SystemSurface } from "../../components/SystemSurface";
import { SystemControlGroup } from "../../components/SystemControlGroup";
import { SystemDisclosure, SystemTabs } from "../../components/SystemNavigation";
import { showSmallNotification } from "../../components/SmallNotificationModal";
import type { PanelPoint } from "../../src/lib/floating-panel";
import { NAV, PROGRAMS } from "../../src/data/catalog";
import type { Program } from "../../types/sejong";
import VioletQuickMenu, { SEJONG_QUICK_MENU_ITEMS } from "../../components/VioletQuickMenu";
import type { VioletQuickMenuItems } from "../../components/VioletQuickMenu";
import {
    SystemBadge,
    SystemButton,
    SystemCheckbox,
    SystemField,
    SystemLink,
    SystemNotice,
} from "../../components/SystemPrimitives";
import {
    CHAPTERS,
    DESIGN_COLORS,
    DESIGN_TOKEN_VALUES,
    GLASS_MATERIALS,
    SEMANTIC_COLORS,
    SPACE_SCALE,
    TYPE_SCALE,
    contrastRatio,
    designTokensCss,
} from "../../src/data/design-system";
import type { ChapterId } from "../../src/data/design-system";
import { HEADER_ACTION_ICONS } from "../../src/system/component-contracts";

const groups = [...new Set(CHAPTERS.map((chapter) => chapter.group))];
const searchEntries = [
    ...CHAPTERS.flatMap((chapter) => [
        { chapter: chapter.id, anchor: "", title: chapter.label, description: chapter.description },
        ...chapter.sections.map(([anchor, title]) => ({
            chapter: chapter.id,
            anchor,
            title,
            description: chapter.label + " · " + chapter.description,
        })),
    ]),
    ...DESIGN_COLORS.map((color) => ({
        chapter: "color" as const,
        anchor: "palette",
        title: color.name,
        description: `--${color.token} · ${color.hex}`,
    })),
    ...TYPE_SCALE.map((type) => ({
        chapter: "typography" as const,
        anchor: "scale",
        title: type.role,
        description: `--${type.token} · ${type.size}px`,
    })),
];
const inlineMenuItems = SEJONG_QUICK_MENU_ITEMS.map((item, index) =>
    index === 0 ? { ...item, href: "/#quick-booking" } : item,
) as unknown as VioletQuickMenuItems;
const sampleTabs = ["공연", "전시", "교육"];

// [팔레트 글자색도 중앙 토큰에 연결 / Bind palette specimen ink to central tokens]
const paletteInkVariable = (hex: string) => {
    const token = Object.entries(DESIGN_TOKEN_VALUES).find(([name, value]) => name.startsWith("--color-") && value.toUpperCase() === hex.toUpperCase())?.[0];
    if (!token) throw new Error("팔레트 글자색의 공통 토큰을 찾지 못했습니다.");
    return `var(${token})`;
};

// [원본 토큰으로 표시하는 규격 / Display dimensions from canonical tokens]
const tokenPixels = (token: keyof typeof DESIGN_TOKEN_VALUES) => {
    let value = DESIGN_TOKEN_VALUES[token];
    const visited = new Set([token]);
    let reference = value.match(/^var\((--[\w-]+)\)$/);
    while (reference && !visited.has(reference[1] as keyof typeof DESIGN_TOKEN_VALUES)) {
        const next = reference[1] as keyof typeof DESIGN_TOKEN_VALUES;
        if (!DESIGN_TOKEN_VALUES[next]) break;
        visited.add(next);
        value = DESIGN_TOKEN_VALUES[next];
        reference = value.match(/^var\((--[\w-]+)\)$/);
    }
    return value.endsWith("rem") ? `${Number.parseFloat(value) * 16}px` : value;
};

function Section({
    chapter,
    id,
    title,
    children,
}: {
    chapter: ChapterId;
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section data-text="body" className="ds-section" id={`${chapter}-${id}`} data-doc-section>
            <h2 data-text="heading" tabIndex={-1}>{title}</h2>
            {children}
        </section>
    );
}

function DataTable({
    label,
    headings,
    rows,
}: {
    label: string;
    headings: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="ds-table-wrap" tabIndex={0} role="region" aria-label={label}>
            <table className="ds-table">
                <thead>
                    <tr>
                        {headings.map((heading) => (
                            <th data-text="label" key={heading} scope="col">
                                {heading}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, cellIndex) => (
                                <td data-text="body" key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// [문서의 탐색·검색·이력 / Document navigation, search and history]
// 각 장과 목차를 URL로 공유하고 키보드·모바일에서도 같은 문서를 탐색합니다.
// Share chapter and section URLs while keeping keyboard and mobile navigation equivalent.
export default function DesignRulesPage() {
    const [chapterId, setChapterId] = useState<ChapterId>("overview");
    const [navigation, setNavigation] = useState(0);
    const [activeSection, setActiveSection] = useState("");
    const [query, setQuery] = useState("");
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState("");
    const [specimen, setSpecimen] = useState("공연이 있는 날, 세종에서 만나요.");
    const [specimenSize, setSpecimenSize] = useState(32);
    const [specimenWeight, setSpecimenWeight] = useState(600);
    const [demoTab, setDemoTab] = useState(0);
    const [demoDate, setDemoDate] = useState("2026-10-23");
    const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
    const floatingMenuTrigger = useRef<HTMLButtonElement>(null);
    const floatingMenuPosition = useRef<PanelPoint | null>(null);
    const closeFloatingMenu = useCallback(() => setFloatingMenuOpen(false), []);
    const searchDialog = useRef<HTMLDialogElement>(null);
    const navigationDialog = useRef<HTMLDialogElement>(null);
    const demoDialog = useRef<HTMLDialogElement>(null);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingTarget = useRef<{ chapter: ChapterId; anchor: string; example?: string } | null>(null);
    const chapter = CHAPTERS.find((item) => item.id === chapterId)!;
    const chapterIndex = CHAPTERS.findIndex((item) => item.id === chapterId);
    const normalizedQuery = query.toLocaleLowerCase().replace(/\s/g, "");
    const results = searchEntries
        .filter(
            (entry) =>
                !normalizedQuery ||
                (entry.title + entry.description)
                    .toLocaleLowerCase()
                    .replace(/\s/g, "")
                    .includes(normalizedQuery),
        )
        .slice(0, 10);

    const navigate = useCallback(
        (next: ChapterId, anchor = "", event?: MouseEvent<HTMLAnchorElement>) => {
            if (
                event &&
                (event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0)
            )
                return;
            event?.preventDefault();
            pendingTarget.current = { chapter: next, anchor };
            history.pushState(null, "", `#${next}${anchor ? "/" + anchor : ""}`);
            setChapterId(next);
            setNavigation((value) => value + 1);
            setMessage("");
            searchDialog.current?.close();
            navigationDialog.current?.close();
        },
        [],
    );

    useEffect(() => {
        const previousTitle = document.title;
        const readLocation = () => {
            let parts: string[];
            try {
                parts = decodeURIComponent(location.hash.slice(1)).split("/");
            } catch {
                parts = [];
            }
            if (parts[0] === "violet-quick-menu") parts = ["motion", "quick-menu"];
            const next = CHAPTERS.find((item) => item.id === parts[0]) || CHAPTERS[0];
            const anchor = next.sections.some(
                (section: readonly [string, string]) => section[0] === parts[1],
            )
                ? parts[1]
                : "";
            pendingTarget.current = { chapter: next.id, anchor, example: next.id === "components" && anchor === "registry" && /^example-[a-z0-9-]+$/.test(parts[2] || "") ? parts[2] : undefined };
            setMessage("");
            setCopied("");
            setChapterId(next.id);
            setNavigation((value) => value + 1);
        };
        const keyboard = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
                event.preventDefault();
                if (!document.querySelector(".design-system-page dialog[open]"))
                    searchDialog.current?.showModal();
            }
        };
        readLocation();
        window.addEventListener("hashchange", readLocation);
        window.addEventListener("popstate", readLocation);
        window.addEventListener("keydown", keyboard);
        return () => {
            window.removeEventListener("hashchange", readLocation);
            window.removeEventListener("popstate", readLocation);
            window.removeEventListener("keydown", keyboard);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            document.title = previousTitle;
        };
    }, []);

    useEffect(() => {
        document.title = `${chapter.label} · 세종문화회관 디자인 시스템`;
        setActiveSection(`${chapter.id}-${chapter.sections[0][0]}`);
        let frame = 0;
        const pending = pendingTarget.current;
        if (pending?.chapter === chapter.id) {
            pendingTarget.current = null;
            frame = requestAnimationFrame(() => {
                const target = pending.example ? document.getElementById(pending.example) : pending.anchor
                    ? document.getElementById(`${chapter.id}-${pending.anchor}`)
                    : document.getElementById("doc-page-title");
                if (pending.anchor && target) {
                    target.scrollIntoView({
                        block: "start",
                        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                            ? "auto"
                            : "smooth",
                    });
                    target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
                } else {
                    window.scrollTo({ top: 0, behavior: "instant" });
                    target?.focus({ preventScroll: true });
                }
            });
        }
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries)
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
            },
            { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
        );
        document
            .querySelectorAll("[data-doc-section]")
            .forEach((section) => observer.observe(section));
        return () => {
            if (frame) cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [chapter, navigation]);

    const copyValue = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(label);
            setMessage(`${label}을 복사했습니다.`);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(""), 1800);
        } catch {
            setMessage("복사 권한을 확인하거나 아래 코드에서 직접 복사해 주세요.");
        }
    };
    const downloadTokens = () => {
        const url = URL.createObjectURL(
            new Blob([designTokensCss()], { type: "text/css;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "sejong-v5-tokens.css";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage("디자인 토큰 CSS 파일을 내려받았습니다.");
    };
    const navigationLinks = (mobile = false) => (
        <nav data-text="body" aria-label={mobile ? "모바일 디자인 시스템 분류" : "디자인 시스템 분류"}>
            {groups.map((group) => (
                <div data-text="body" className="ds-nav-group" key={group}>
                    <p data-text="body">{group}</p>
                    {CHAPTERS.filter((item) => item.group === group).map((item) => (
                        <a data-text="action"
                            key={item.id}
                            href={`#${item.id}`}
                            aria-current={chapterId === item.id ? "page" : undefined}
                            onClick={(event) => navigate(item.id, "", event)}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            ))}
        </nav>
    );
    const section = (id: string, title: string, children: ReactNode) => (
        <Section key={id} chapter={chapterId} id={id} title={title}>
            {children}
        </Section>
    );

    // [실제 토큰과 컴포넌트의 문서 / Documentation of working tokens and components]
    // 컬러·서체·상태 예제는 제품 코드와 같은 원본을 사용합니다.
    // Color, typography and state specimens use the same sources as product code.
    const renderChapter = () => {
        switch (chapterId) {
            case "overview":
                return (
                    <>
                        {section(
                            "principles",
                            "설계 원칙",
                            <>
                                <p data-text="body">
                                    세종의 상징과 예술 콘텐츠가 먼저 보이도록, 인터페이스는 읽기
                                    쉽고 예측 가능한 기준을 가집니다.
                                </p>
                                <div data-text="body" className="ds-principles">
                                    {[
                                        [
                                            "01",
                                            "읽는 크기를 지킵니다",
                                            "본문·메뉴·도움말은 16px에서 시작합니다. 좁은 화면에서도 글자 대신 구성을 조정합니다.",
                                        ],
                                        [
                                            "02",
                                            "같은 역할은 같습니다",
                                            "버튼의 크기, 간격, 모서리와 상태를 같은 토큰으로 연결합니다.",
                                        ],
                                        [
                                            "03",
                                            "브랜드를 정확히 씁니다",
                                            "기존 컬러와 로고의 원형을 유지하고, 역할과 사용 범위를 분명하게 정합니다.",
                                        ],
                                    ].map(([number, title, text]) => (
                                        <div className="ds-principle" key={number}>
                                            <span data-text="body">{number}</span>
                                            <h3 data-text="subheading">{title}</h3>
                                            <p data-text="body">{text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="ds-brand-stage" style={{ marginTop: 32 }}>
                                    <img
                                        src="/v5/assets/images/sejong-wordmark.png"
                                        width={236}
                                        height={43}
                                        alt="세종문화회관 로고"
                                    />
                                </div>
                                <p data-text="caption" className="ds-caption">
                                    웹사이트에 사용하는 색상과 글자, 컴포넌트의 적용 기준입니다.
                                </p>
                            </>,
                        )}
                        {section(
                            "structure",
                            "시스템의 구성",
                            <div data-text="body" className="ds-chapter-list">
                                {CHAPTERS.slice(1).map((item, index) => (
                                    <a data-text="action"
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(event) => navigate(item.id, "", event)}
                                    >
                                        <span data-text="body">{String(index + 1).padStart(2, "0")}</span>
                                        <div>
                                            <strong data-text="item-title">{item.label}</strong>
                                            <p data-text="body">{item.description}</p>
                                        </div>
                                        <Icon name="arrow" size={24} />
                                    </a>
                                ))}
                            </div>,
                        )}
                    </>
                );
            case "brand":
                return (
                    <>
                        {section(
                            "signature",
                            "기본형",
                            <>
                                <p data-text="body">
                                    세종문화회관의 워드마크와 심벌은 원본 파일을 사용합니다.
                                    화면에서 읽기 쉬운 크기와 바탕을 먼저 확보합니다.
                                </p>
                                <div className="ds-two-columns">
                                    <div>
                                        <div className="ds-brand-stage">
                                            <img
                                                src="/v5/assets/images/sejong-wordmark.png"
                                                alt="밝은 바탕의 세종문화회관 워드마크"
                                                width={236}
                                                height={43}
                                            />
                                        </div>
                                        <p data-text="caption" className="ds-caption">기본형 · 밝은 바탕</p>
                                    </div>
                                    <div>
                                        <div className="ds-brand-stage ds-brand-stage-inverse">
                                            <img
                                                src="/v5/assets/images/sejong-wordmark.png"
                                                alt="어두운 바탕의 반전 워드마크"
                                                width={236}
                                                height={43}
                                            />
                                        </div>
                                        <p data-text="caption" className="ds-caption">반전형 · 어두운 바탕</p>
                                    </div>
                                </div>
                                <h3 data-text="subheading">보와 기둥</h3>
                                <div className="ds-demo-row">
                                    <img
                                        src="/v5/assets/images/sejong-official-symbol.png"
                                        width={64}
                                        height={66}
                                        alt="보와 기둥으로 구성된 세종문화회관 심벌"
                                    />
                                    <p data-text="body">
                                        건축의 구조를 닮은 상징은 브랜드 영역에서 사용합니다. 일반
                                        버튼과 안내 아이콘을 대신하지 않습니다.
                                    </p>
                                </div>
                            </>,
                        )}
                        {section(
                            "clearspace",
                            "보호 공간과 최소 크기",
                            <>
                                <p data-text="body">
                                    다른 글자나 경계가 로고에 붙지 않도록 여백을 확보합니다. 아래
                                    값은 v5 화면에서의 권장 기준입니다.
                                </p>
                                <div className="ds-clearspace-stage">
                                    <div className="ds-clearspace">
                                        <span data-text="body">상하좌우 0.5x 이상</span>
                                        <img
                                            src="/v5/assets/images/sejong-wordmark.png"
                                            width={236}
                                            height={43}
                                            alt="보호 공간 안에 배치한 로고"
                                        />
                                    </div>
                                </div>
                                <DataTable
                                    label="로고의 디지털 사용 기준"
                                    headings={["항목", "v5 기준", "적용"]}
                                    rows={[
                                        [
                                            "기준 단위 x",
                                            "워드마크의 높이",
                                            "원본 가로세로 비율 유지",
                                        ],
                                        [
                                            "최소 가로 폭",
                                            "데스크톱 160px · 모바일 128px",
                                            "헤더의 워드마크",
                                        ],
                                        ["심벌 최소 크기", "32px", "식별이 필요한 단독 심벌"],
                                        [
                                            "보호 공간",
                                            "로고 높이의 0.5배 이상",
                                            "주변 글자·도형·경계와의 거리",
                                        ],
                                    ]}
                                />
                            </>,
                        )}
                        {section(
                            "usage",
                            "올바른 사용",
                            <div className="ds-two-columns">
                                <div className="ds-rule-example">
                                    <strong data-text="item-title">
                                        <Icon name="check" size={24} />
                                        사용
                                    </strong>
                                    <img
                                        src="/v5/assets/images/sejong-wordmark.png"
                                        width={160}
                                        height={29}
                                        alt="원형을 유지한 로고"
                                    />
                                    <p data-text="body">비율과 색을 유지하고 단색의 충분한 여백 위에 놓습니다.</p>
                                </div>
                                <div className="ds-rule-example" data-incorrect>
                                    <strong data-text="item-title">
                                        <Icon name="close" size={24} />
                                        피하기
                                    </strong>
                                    <img
                                        src="/v5/assets/images/sejong-wordmark.png"
                                        width={160}
                                        height={29}
                                        alt="사용 금지 예: 가로로 늘어나고 흐릿해진 로고"
                                    />
                                    <p data-text="body">
                                        비율을 늘이거나 투명도를 낮추지 않습니다. 그림자·외곽선·임의
                                        효과를 더하지 않습니다.
                                    </p>
                                </div>
                            </div>,
                        )}
                        {section(
                            "icons",
                            "아이콘",
                            <>
                                <p data-text="body">
                                    로컬 Material Symbols Rounded SVG를 사용합니다. 기본 크기는
                                    24px, 문장 안에서는 20px로 정하고 조작 영역은 48px를 확보합니다.
                                </p>
                                <div data-text="body" className="ds-icon-grid">
                                    {[
                                        ["calendar", "일정"],
                                        ["ticket", "예매"],
                                        ["pin", "위치"],
                                        ["search", "검색"],
                                        ["heart", "관심"],
                                        ["user", "내 정보"],
                                        ["check", "완료"],
                                        ["close", "닫기"],
                                    ].map(([name, label]) => (
                                        <div key={name}>
                                            <Icon name={name} size={24} />
                                            <span data-text="body">{label}</span>
                                        </div>
                                    ))}
                                </div>
                                <ul className="ds-rules-list">
                                    <li data-text="body">아이콘의 색은 주변 글자의 currentColor를 따릅니다.</li>
                                    <li data-text="body">
                                        장식 아이콘은 읽기 순서에서 숨기고, 아이콘만 있는 버튼에는
                                        행동 이름을 제공합니다.
                                    </li>
                                    <li data-text="body">
                                        라운드 아이콘과 다른 굵기·스타일을 임의로 섞지 않습니다.
                                    </li>
                                </ul>
                                <h3 data-text="subheading">헤더 액션 그룹</h3>
                                <p data-text="body">검색·전체 메뉴 두 아이콘은 <code data-text="body">group="header-action"</code>으로 구분합니다. 내부 기호는 28px, 원형 조작 영역은 48px이며 중앙 정렬과 원래 비율을 유지합니다. 일반 아이콘은 기존 크기를 사용합니다.</p>
                                <div className="ds-icon-grid">{HEADER_ACTION_ICONS.map(name => <div key={name}><Icon name={name} group="header-action" /><span data-text="utility">{name === "search" ? "헤더 검색" : "헤더 전체 메뉴"}</span></div>)}</div>
                            </>,
                        )}
                    </>
                );
            case "color":
                return (
                    <>
                        {section(
                            "palette",
                            "기본 팔레트",
                            <>
                                <p data-text="body">
                                    현재 v5의 여덟 가지 기본색을 유지합니다. 노랑은 실제 CSS 값인
                                    #F7D549를 기준으로 문서와 코드를 일치시킵니다.
                                </p>
                                <div data-text="body" className="ds-palette">
                                    {DESIGN_COLORS.map((color) => (
                                        <div className="ds-color-card" key={color.token}>
                                            <div
                                                className="ds-color-swatch"
                                                style={{
                                                    background: `var(--${color.token})`,
                                                    color: paletteInkVariable(color.ink),
                                                }}
                                            >
                                                <span data-text="body">Aa</span>
                                            </div>
                                            <h3 data-text="subheading">{color.name}</h3>
                                            <code data-text="caption" className="ds-token">--{color.token}</code>
                                            <button data-text="action"
                                                className="ds-copy-color"
                                                onClick={() => copyValue(color.hex, color.name)}
                                                aria-label={`${color.name} ${color.hex} 복사`}
                                            >
                                                <span data-text="body">
                                                    {copied === color.name ? "복사됨" : color.hex}
                                                </span>
                                                <Icon
                                                    name={
                                                        copied === color.name
                                                            ? "check"
                                                            : "content_copy"
                                                    }
                                                    size={20}
                                                />
                                            </button>
                                            <p data-text="body">{color.use}</p>
                                        </div>
                                    ))}
                                </div>
                            </>,
                        )}
                        {section(
                            "semantic",
                            "역할별 컬러",
                            <>
                                <p data-text="body">
                                    컴포넌트에서는 색상 이름보다 역할 토큰을 사용합니다. 같은 종류의
                                    정보가 페이지마다 다른 색을 갖지 않도록 합니다.
                                </p>
                                <DataTable
                                    label="역할별 컬러 토큰"
                                    headings={["역할", "토큰", "원본", "사용"]}
                                    rows={SEMANTIC_COLORS.map(([group, token, source, use]) => [
                                        group,
                                        <code data-text="caption" className="ds-token" key={token}>
                                            --{token}
                                        </code>,
                                        <code data-text="caption" className="ds-token" key={source}>
                                            --{source}
                                        </code>,
                                        use,
                                    ])}
                                />
                            </>,
                        )}
                        {section(
                            "contrast",
                            "명도 대비",
                            <>
                                <p data-text="body">
                                    일반 본문은 4.5:1 이상의 대비를 기준으로 확인합니다. 밝은
                                    브랜드색 위의 글자는 검정으로 사용합니다.
                                </p>
                                <DataTable
                                    label="실제 컬러 조합의 명도 대비"
                                    headings={["조합", "예시", "계산값", "일반 본문"]}
                                    rows={[
                                        ["어스 블랙 / 웜 화이트", "--color-black", "--color-white"],
                                        ["어스 블랙 / 하늘", "--color-black", "--color-sky"],
                                        ["어스 블랙 / 노랑", "--color-black", "--color-yellow"],
                                        ["진한 글자 / 황토", "--color-ink-strong", "--color-ochre"],
                                        ["보조 글자 / 웜 화이트", "--color-gray-600", "--color-white"],
                                        ["웜 화이트 / 하늘", "--color-white", "--color-sky"],
                                    ].map(([label, inkToken, backgroundToken]) => {
                                        const ink = DESIGN_TOKEN_VALUES[inkToken as keyof typeof DESIGN_TOKEN_VALUES];
                                        const background = DESIGN_TOKEN_VALUES[backgroundToken as keyof typeof DESIGN_TOKEN_VALUES];
                                        return [
                                        label,
                                        <span data-text="body"
                                            className="ds-contrast-sample"
                                            key={label}
                                            style={{ color: `var(${inkToken})`, background: `var(${backgroundToken})` }}
                                        >
                                            가독성
                                        </span>,
                                        `${contrastRatio(ink, background).toFixed(2)} : 1`,
                                        contrastRatio(ink, background) >= 4.5
                                            ? "사용 가능"
                                            : "피하기",
                                    ]; })}
                                />
                                <p data-text="caption" className="ds-caption">
                                    색만으로 오류·선택·성공을 알리지 않습니다. 아이콘, 문장과 상태
                                    속성을 함께 사용합니다.{" "}
                                    <a data-text="action"
                                        href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        W3C 명도 대비 기준 (새 창)
                                    </a>
                                </p>
                            </>,
                        )}
                    </>
                );
            case "typography":
                return (
                    <>
                        {section(
                            "family",
                            "기본 서체",
                            <>
                                <SystemText as="p" variant="body">
                                    로컬 Wanted Sans Variable을 사용합니다. 기본 본문은 16px / 400 /
                                    행간 1.7입니다. 메뉴·날짜·고지·도움말도 16px 아래로 줄이지
                                    않습니다.
                                </SystemText>
                                {/* 공유 텍스트 속성의 실제 사용 / Live use of shared text properties */}
                                <p {...textAttributes("caption")} className="ds-caption">
                                    새 텍스트는 SystemText의 variant로 역할을 고릅니다. 기존
                                    제목·링크·레이블은 data-text 또는 textAttributes로 같은 역할에
                                    연결하며, HTML의 의미와 조작은 유지합니다. size를 지정할 때도
                                    역할 또는 control·hero-with-companion·hero-standalone·quick-action 크기를 사용합니다.
                                </p>
                                <pre data-text="body"><code data-text="meta">{`<SystemText as="h2" variant="heading">관람 예약</SystemText>
<p {...textAttributes("caption")}>날짜와 관람 안내</p>
<SystemText variant="body" size="lead">예매한 일정을 확인하세요.</SystemText>`}</code></pre>
                                <div className="ds-type-intro">
                                    <strong data-text="item-title">
                                        가나다, 세종.
                                        <br />
                                        Aa 0123456789
                                    </strong>
                                    <p data-text="body">
                                        Wanted Sans Variable · 400 / 500 / 600 / 700
                                        <br />
                                        한글과 숫자, 영문이 함께 놓이는 화면을 같은 글꼴로
                                        정돈합니다.
                                    </p>
                                </div>
                            </>,
                        )}
                        {section(
                            "scale",
                            "크기와 위계",
                            <>
                                <p data-text="body">
                                    크기를 줄여 화면에 맞추기보다 줄바꿈과 배치를 조정합니다. 작은
                                    화면에서도 본문 기준은 같습니다.
                                </p>
                                {TYPE_SCALE.map((type) => (
                                    <div className="ds-type-row" key={type.token}>
                                        <div className="ds-type-meta">
                                            <strong data-text="item-title">{type.role}</strong>
                                            <span data-text="body">
                                                {type.mobile === type.size
                                                    ? type.size
                                                    : `${type.mobile}–${type.size}`}
                                                px · {type.weight}
                                            </span>
                                            <code data-text="caption" className="ds-token">--{type.token}</code>
                                        </div>
                                        <div className="ds-type-sample">
                                            <div data-text="body"
                                                style={{
                                                    fontSize: `var(--${type.token})`,
                                                    fontWeight: type.weight,
                                                    lineHeight: type.leading,
                                                }}
                                            >
                                                예술을 만나는 날
                                            </div>
                                            <p data-text="caption" className="ds-caption">
                                                {type.use} · 행간 {type.leading}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <p data-text="caption" className="ds-caption">
                                    본문 자간 −0.015em, 제목 자간 −0.035em. 제목과 본문의 위계는
                                    공유 텍스트 역할에서 관리하며, 보조 정보도 최소 16px를 유지합니다.
                                </p>
                            </>,
                        )}
                        {section(
                            "specimen",
                            "직접 조합하기",
                            <>
                                <SystemField data-text="body"
                                    id="type-specimen-text"
                                    label="확인할 문장"
                                    value={specimen}
                                    maxLength={120}
                                    onChange={(event) => setSpecimen(event.target.value)}
                                    hint="한글·영문·숫자가 섞인 실제 문장으로 확인해 보세요."
                                />
                                <div className="ds-specimen" style={{ marginTop: 24 }}>
                                    <div className="ds-specimen-controls">
                                            <SystemField data-text="body"
                                                as="select"
                                                label="크기"
                                                id="type-size"
                                                value={specimenSize}
                                                onChange={(event) =>
                                                    setSpecimenSize(Number(event.target.value))
                                                }
                                            >
                                                {[16, 18, 20, 24, 32, 48, 64].map((size) => (
                                                    <option data-text="label" key={size} value={size}>
                                                        {size}px
                                                    </option>
                                                ))}
                                            </SystemField>
                                            <SystemField data-text="body"
                                                as="select"
                                                label="굵기"
                                                id="type-weight"
                                                value={specimenWeight}
                                                onChange={(event) =>
                                                    setSpecimenWeight(Number(event.target.value))
                                                }
                                            >
                                                {[400, 500, 600, 700].map((weight) => (
                                                    <option data-text="label" key={weight}>{weight}</option>
                                                ))}
                                            </SystemField>
                                    </div>
                                    <div data-text="body"
                                        className="ds-live-type"
                                        data-type-specimen
                                        style={{
                                            fontSize: specimenSize,
                                            fontWeight: specimenWeight,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {specimen || "문장을 입력해 주세요."}
                                    </div>
                                </div>
                            </>,
                        )}
                    </>
                );
            case "layout":
                return (
                    <>
                        {section(
                            "grid",
                            "그리드와 화면",
                            <>
                                <p data-text="body">
                                    콘텐츠는 최대 {tokenPixels("--container")}까지 넓게 사용합니다.
                                    문단은 {DESIGN_TOKEN_VALUES["--content-reading-width"]}, 입력 양식은 용도에 맞는 읽기 폭을 따로 둡니다.
                                    카드와 목록은 남는 너비를 채우고 버튼과 레이블은 내용에 맞춰 늘어납니다.
                                </p>
                                <div data-text="body" className="ds-grid-sample" aria-label="반응형 그리드 예제">
                                    {Array.from({ length: 12 }, (_, index) => (
                                        <span data-text="body" key={index}>{index + 1}</span>
                                    ))}
                                </div>
                                <DataTable
                                    label="화면 크기별 레이아웃 기준"
                                    headings={["화면", "분할", "권장 좌우 여백", "읽기"]}
                                    rows={[
                                        ["1280px 이상", "12열", "32–48px", "넓은 목록과 별도 읽기 폭"],
                                        ["768–1279px", "8열", "20–32px", "본문 중심 배치"],
                                        ["767px 이하", "4열", "20px", "한 열, 문서 탐색은 메뉴로"],
                                    ]}
                                />
                                <DataTable
                                    label="내용과 공간에 따른 크기 결정"
                                    headings={["요소", "크기 결정", "적용 원칙"]}
                                    rows={[
                                        ["페이지와 목록", "남는 너비 채우기", "minmax(0, 1fr)와 반응형 열"],
                                        ["버튼과 상태", "내용에 맞추기", "높이는 최소 48px, 긴 글은 줄바꿈"],
                                        ["문단과 입력", "읽기 폭 안에서 채우기", "넓은 프레임과 본문의 폭을 분리"],
                                        ["아이콘과 좌석", "역할에 필요한 고정 크기", "아이콘 비례와 좌석의 공간 관계 유지"],
                                    ]}
                                />
                            </>,
                        )}
                        {section(
                            "spacing",
                            "간격",
                            <>
                                <p data-text="body">
                                    4px를 기본 단위로 사용합니다. 관련 정보는 가깝게, 다른 주제는
                                    충분히 떨어뜨립니다.
                                </p>
                                {SPACE_SCALE.map((value) => (
                                    <div className="ds-space-row" key={value}>
                                        <strong data-text="item-title">{value}px</strong>
                                        <code data-text="caption" className="ds-token">space-{value / 4}</code>
                                        <span className="ds-space-bar" style={{ width: value }} />
                                    </div>
                                ))}
                            </>,
                        )}
                        {section(
                            "shape",
                            "형태와 경계",
                            <>
                                <p data-text="body">일반 경계는 옅은 1px 안쪽 선입니다. 버튼·입력·패널은 inset 표면을 공유하고, 초점선도 안쪽에 표시해 크기와 배치가 바뀌지 않습니다. 곡률과 선 색은 아래 토큰에서 함께 관리합니다.</p>
                                <div data-text="body" className="ds-shape-grid">
                                    {([
                                        ["--radius-control", "기본 조작", "버튼·입력·작은 패널"],
                                        ["--radius-flow", "신청·계정", "flow 버튼·입력"],
                                        ["--radius-media", "미디어", "포스터·사진"],
                                        ["--surface-radius-panel", "공통 패널", "안내·계정·예매 표면"],
                                        ["--radius-banner", "배너", "히어로·영상 프레임"],
                                        ["--radius-dialog", "대화상자", "모달·안내 패널"],
                                    ] as const).map(([token, label, text]) => (
                                        <div key={token}>
                                            <div data-text="body"
                                                className="ds-shape-sample"
                                                style={{ borderRadius: `var(${token})` }}
                                            >
                                                {tokenPixels(token)}
                                            </div>
                                            <strong data-text="item-title">{label}</strong>
                                            <p data-text="caption" className="ds-caption">{text}</p>
                                        </div>
                                    ))}
                                </div>
                                <ul className="ds-rules-list">
                                    <li data-text="body">
                                        기본 경계는 1px입니다. 입력 경계는 장식용 구분선보다 진하게
                                        표시합니다.
                                    </li>
                                    <li data-text="body">
                                        상태 알림은 캡슐, 미디어는 {tokenPixels("--radius-media")},
                                        배너는 {tokenPixels("--radius-banner")} 모서리를 사용합니다.
                                    </li>
                                    <li data-text="body">
                                        그림자는 겹쳐진 모달처럼 높이 관계를 설명할 때만 사용합니다.
                                    </li>
                                </ul>
                                {/* 공통 표면과 중첩 정보 예제 / Shared surface and nested information example */}
                                <SystemSurface as="section" variant="subtle" padding="lg" radius="panel" aria-labelledby="surface-demo-heading">
                                    <SystemText as="h3" variant="item-title" id="surface-demo-heading">공통 안내 패널</SystemText>
                                    <p data-text="body">SystemSurface는 기존 section·aside·form의 의미를 보존하며 배경과 경계를 공통 토큰에 연결합니다.</p>
                                    <SystemSurface variant="inset" padding="sm" radius="compact">
                                        <p data-text="caption">안쪽의 관련 정보는 inset 표면으로 구분합니다. 여백과 모서리는 속성으로 선택합니다.</p>
                                    </SystemSurface>
                                </SystemSurface>
                                <pre data-text="body"><code data-text="meta">{`<SystemSurface as="section" variant="subtle" padding="lg" radius="panel">
    <SystemText as="h3" variant="item-title">공통 안내 패널</SystemText>
</SystemSurface>`}</code></pre>
                            </>,
                        )}
                    </>
                );
            case "components":
                return (
                    <>
                        {section("registry", "전체 컴포넌트", <ComponentCatalog />)}
                        {section(
                            "buttons",
                            "버튼",
                            <>
                                <p data-text="body">
                                    {tokenPixels("--control-size")} 높이와 {tokenPixels("--radius-control")} 모서리,
                                    16px 레이블을 기본으로 합니다. 한 영역의 주요 행동은
                                    하나로 정하고 나머지 행동은 우선순위를 낮춥니다.
                                </p>
                                <div className="ds-demo ds-demo-stack">
                                    <div className="ds-demo-row">
                                        <SystemButton data-text="action"
                                            onClick={() =>
                                                setMessage("주요 행동 버튼을 눌렀습니다.")
                                            }
                                        >
                                            예매하기
                                            <Icon name="arrow" size={20} />
                                        </SystemButton>
                                        <SystemButton data-text="action"
                                            variant="secondary"
                                            onClick={() =>
                                                setMessage("보조 행동 버튼을 눌렀습니다.")
                                            }
                                        >
                                            상세 안내
                                        </SystemButton>
                                        <SystemButton data-text="action"
                                            variant="accent"
                                            onClick={() => setMessage("탐색 버튼을 눌렀습니다.")}
                                        >
                                            일정 찾기
                                        </SystemButton>
                                        <SystemButton data-text="action"
                                            variant="highlight"
                                            onClick={() => setMessage("강조 버튼을 눌렀습니다.")}
                                        >
                                            관심 일정 확인
                                        </SystemButton>
                                    </div>
                                    <div className="ds-demo-row">
                                        <SystemButton data-text="action" disabled>예매 준비 중</SystemButton>
                                        <SystemButton data-text="action"
                                            variant="quiet"
                                            onClick={() => setMessage("취소 버튼을 눌렀습니다.")}
                                        >
                                            취소
                                        </SystemButton>
                                        <SystemButton data-text="action"
                                            context="flow"
                                            aria-label="flow 버튼 규격"
                                            onClick={() => setMessage("flow 버튼의 조작을 확인했습니다.")}
                                        >
                                            flow 버튼 규격
                                        </SystemButton>
                                    </div>
                                    <p data-text="caption" className="ds-caption">
                                        flow 버튼은 {tokenPixels("--control-flow-button-size")} 높이와
                                        {" "}{tokenPixels("--radius-flow")} 모서리를 사용합니다.
                                    </p>
                                    <div className="ds-demo-row ds-overlay-controls">
                                        <SystemButton data-text="action" variant="inverse" onClick={() => setMessage("이미지 위의 주요 행동입니다.")}>상세보기</SystemButton>
                                        <SystemButton data-text="action" variant="inverse-outline" onClick={() => setMessage("이미지 위의 보조 행동입니다.")}>예매하기</SystemButton>
                                        <SystemButton data-text="action" variant="inverse-quiet" onClick={() => setMessage("히어로의 양옆 작품을 선택하는 같은 버튼입니다.")}>다음 작품 <Icon name="arrow" size={20} /></SystemButton>
                                    </div>
                                    <p data-text="caption" className="ds-caption">inverse-quiet는 사진 위에서 테두리 없이 사용하는 반전 버튼입니다. 히어로의 인접 작품 제목에 같은 구현을 사용합니다.</p>
                                </div>
                                <DataTable
                                    label="버튼의 조작 상태"
                                    headings={["상태", "표현", "동작"]}
                                    rows={[
                                        ["기본", "역할에 맞는 면과 레이블", "고정된 위치"],
                                        ["호버", "배경·경계의 명도 변화", DESIGN_TOKEN_VALUES["--duration-feedback"]],
                                        ["눌림", "면의 명도 변화", "실제 누르고 있는 동안"],
                                        ["초점", `${DESIGN_TOKEN_VALUES["--focus-width"]} 안쪽 초점선 · offset ${DESIGN_TOKEN_VALUES["--focus-offset"]}`, "키보드에서 분명하게 · 배치 변화 없음"],
                                        ["비활성", "비활성 면 + 상태 문구", "실제 disabled 속성"],
                                    ]}
                                />
                            </>,
                        )}
                        {section(
                            "cards",
                            "콘텐츠 카드",
                            <>
                                <p data-text="body">
                                    포스터·제목·일정·장소는 하나의 목적지로 연결합니다. 관심 버튼은
                                    별도의 형제 버튼으로 두고 키보드와 터치에서도 사용할 수 있게
                                    합니다.
                                </p>
                                <div className="ds-two-columns">
                                    <div className="ds-card-example">
                                        <ProgramCard program={PROGRAMS[0] as unknown as Program} />
                                    </div>
                                    <div>
                                        <h3 data-text="subheading">정보의 순서</h3>
                                        <ol className="ds-rules-list">
                                            <li data-text="body">3:4 포스터, 여백 없이 비율 유지 크롭</li>
                                            <li data-text="body">분류와 상태</li>
                                            <li data-text="body">20px 제목</li>
                                            <li data-text="body">16px 일정과 장소</li>
                                        </ol>
                                        <h3 data-text="subheading">조작의 구분</h3>
                                        <p data-text="caption" className="ds-caption">
                                            카드 전체는 상세 안내로 이동합니다. 관심 버튼은 저장
                                            상태만 변경하며 저장 결과를 알림으로 안내합니다. 호버로
                                            카드를 들어 올리지 않습니다.
                                        </p>
                                    </div>
                                </div>
                            </>,
                        )}
                        {section(
                            "fields",
                            "입력",
                            <>
                                <p data-text="body">
                                    레이블은 입력값이 생겨도 사라지지 않습니다. 도움말과 오류는
                                    필드에 연결해 이유와 다음 행동을 알려줍니다.
                                </p>
                                <div className="ds-demo ds-demo-stack">
                                    <div className="ds-two-columns">
                                        <SystemField data-text="body"
                                            id="demo-field-default"
                                            label="기본 입력 규격"
                                            placeholder="기본 조작"
                                            hint={`${tokenPixels("--control-size")} 높이 · ${tokenPixels("--radius-control")} 모서리`}
                                        />
                                        <SystemField data-text="body"
                                            id="demo-field-flow"
                                            variant="flow"
                                            label="flow 입력 규격"
                                            placeholder="신청·계정 조작"
                                            hint={`${tokenPixels("--control-flow-field-size")} 높이 · ${tokenPixels("--radius-flow")} 모서리`}
                                        />
                                    </div>
                                    <div className="ds-two-columns">
                                        <SystemField data-text="body"
                                            id="demo-name"
                                            label="이름"
                                            placeholder="관람하실 분의 이름"
                                            hint="공백을 포함해 입력할 수 있습니다."
                                        />
                                        <SystemField data-text="body"
                                            id="demo-error"
                                            label="이메일"
                                            type="email"
                                            defaultValue="sejong@"
                                            error="이메일 주소를 끝까지 입력해 주세요."
                                        />
                                    </div>
                                    <SystemField data-text="body"
                                        id="demo-disabled"
                                        label="예매 번호"
                                        value="예매 후 확인할 수 있습니다"
                                        disabled
                                        readOnly
                                    />
                                    <SystemCheckbox data-text="label" label="선택한 관람 정보를 확인했습니다." />
                                </div>
                            </>,
                        )}
                        {section(
                            "navigation",
                            "탭과 펼침",
                            <>
                                <p data-text="body">
                                    같은 수준의 콘텐츠는 탭으로, 선택해서 읽는 상세 설명은 펼침으로
                                    묶습니다. 탭은 방향키와 Home·End로 이동할 수 있습니다.
                                </p>
                                <div className="ds-demo">
                                    <SystemTabs
                                        idPrefix="sample"
                                        aria-label="프로그램 분류 예제"
                                        value={String(demoTab)}
                                        onValueChange={(value) => setDemoTab(Number(value))}
                                        items={sampleTabs.map((label, index) => ({
                                            id: String(index),
                                            label,
                                            content: [
                                                "공연명, 날짜와 장소를 같은 순서로 안내합니다.",
                                                "전시 기간과 운영 시간을 함께 안내합니다.",
                                                "수강 대상, 교육 일시와 신청 기간을 함께 안내합니다.",
                                            ][index],
                                        }))}
                                    />
                                    <SystemDisclosure summary="관람 안내는 어떻게 표현하나요?">
                                        <p data-text="body">
                                            제한 사항과 준비할 내용을 짧은 문장으로 먼저 안내하고,
                                            필요한 상세 내용만 펼쳐서 읽도록 합니다.
                                        </p>
                                    </SystemDisclosure>
                                </div>
                                {/* [제품과 같은 비율 메뉴 / The same proportional menu as the product] */}
                                <h3 data-text="subheading">메뉴 폭과 줄바꿈</h3>
                                <p data-text="body">
                                    SystemControlGroup은 항목의 픽셀 폭을 정하지 않고 전체 너비에서
                                    간격을 뺀 나머지를 퍼센트로 나눕니다. 기본값은 768px 미만 2열,
                                    768px부터 3열, 1024px부터 6열입니다. 항목이 적으면 실제 개수까지만
                                    나누고 마지막 줄도 남는 폭을 채웁니다. 같은 행의 높이는 가장 긴
                                    문구에 맞추며, 글자는 16px 이상과 조작 높이 48px 이상을 유지합니다.
                                </p>
                                <div className="ds-demo">
                                    <SystemControlGroup as="nav" id="demo-visit-navigation" aria-label="반응형 이용안내 메뉴 예제">
                                        {NAV.find((group) => group.id === "visit")?.items?.map(([label, href]) => (
                                            <SystemLink key={href} href={href} variant="secondary">{label}</SystemLink>
                                        ))}
                                    </SystemControlGroup>
                                </div>
                                <DataTable
                                    label="SystemControlGroup 비율 규격"
                                    headings={["속성", "기본값", "역할"]}
                                    rows={[
                                        ["as", "div", "nav · div · section · ul · ol의 의미 보존"],
                                        ["columns", "compact: 2 / medium: 3 / wide: 6", "화면 구간마다 1–6열 지정"],
                                        ["maxColumns", "6", "항목 수와 함께 최대 열 수 제한"],
                                        ["항목 너비", "(100% − 간격 × (열 수 − 1)) ÷ 열 수", "부모 너비에 반응하며 줄바꿈"],
                                    ]}
                                />
                            </>,
                        )}
                        {section(
                            "liquid-glass",
                            "리퀴드 글래스",
                            <>
                                <p data-text="body">
                                    <code data-text="caption" className="ds-token">LiquidGlass</code>는 실제 배경을
                                    굴절시키는 공통 표면 컴포넌트입니다. 불투명한 중심과 맑게
                                    굴절되는 가장자리를 나누고, 반사광과 안쪽 음영으로 유리의 두께를
                                    표현합니다. 안에 넣은 글자와 버튼은 선명하게 유지합니다.
                                </p>
                                <LiquidGlassDemo
                                    onCopy={(code) => copyValue(code, "리퀴드 글래스 코드")}
                                    copied={copied === "리퀴드 글래스 코드"}
                                />
                                <DataTable
                                    label="LiquidGlass 컴포넌트 속성"
                                    headings={["속성", "기본값", "역할"]}
                                    rows={[
                                        ["variant", "surface", "surface · 기본 표면 / drawer · 서랍 / hero · 히어로 / white · 밝은 알림 / black · 어두운 알림"],
                                        ["opacity", GLASS_MATERIALS.surface.opacity, "흰 유리의 불투명도 · 0–1"],
                                        ["refraction", GLASS_MATERIALS.surface.refraction, "굴절 강도 · 0–120"],
                                        ["blur", GLASS_MATERIALS.surface.blur, "중심부 배경 흐림 · 0–40px"],
                                        ["thickness", GLASS_MATERIALS.surface.thickness, "굴절되는 가장자리의 두께 · 1–64px"],
                                        [
                                            "children / ref / HTML 속성",
                                            "기본 div와 동일",
                                            "콘텐츠·초점·위치·이벤트 연결",
                                        ],
                                    ]}
                                />
                                <DataTable
                                    label="리퀴드 글래스 재질 베리언트"
                                    headings={["베리언트", "불투명도", "굴절", "흐림", "두께"]}
                                    rows={Object.entries(GLASS_MATERIALS).map(([variant, material]) => [
                                        variant,
                                        `${Math.round(material.opacity * 100)}%`,
                                        material.refraction,
                                        `${material.blur}px`,
                                        `${material.thickness}px`,
                                    ])}
                                />
                                <p data-text="caption" className="ds-caption">
                                    기본값은 디자인 토큰을 따릅니다. 속성을 지정하면 해당 표면만
                                    바뀌며, 전체 메뉴도 같은 컴포넌트를 사용합니다. 고대비·투명도
                                    감소 설정에서는 불투명한 흰 표면으로 전환합니다.
                                </p>
                            </>,
                        )}
                        {section(
                            "floating-menu",
                            "떠 있는 유리 메뉴",
                            <>
                                <p data-text="body">
                                    <code data-text="caption" className="ds-token">FloatingPanel</code>은{" "}
                                    <code data-text="caption" className="ds-token">LiquidGlass</code>를 사용하는 공통
                                    목록 창입니다. 위치·드래그·초점·등장과 퇴장을 담당하며,{" "}
                                    <code data-text="caption" className="ds-token">FloatingMenu</code>는 그 안에 실제
                                    사이트의 탐색 목록을 넣는 컴포넌트입니다.
                                </p>
                                <p data-text="body">
                                    전체 메뉴는 페이지를 가리는 흰 덮개 없이 독립된 창으로 뜹니다.
                                    기존 흰색과 검정의 투명도, 배경의 흐림, 둥근 가장자리의 굴절과
                                    반사를 겹쳐 깊이를 표현합니다. 글자는 굴절시키지 않습니다.
                                </p>
                                <div className="ds-demo">
                                    <SystemButton data-text="action"
                                        ref={floatingMenuTrigger}
                                        aria-haspopup="dialog"
                                        aria-expanded={floatingMenuOpen}
                                        aria-controls="menu-dialog"
                                        onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}
                                    >
                                        전체 메뉴 열기 <Icon name="menu" size={24} />
                                    </SystemButton>
                                    <FloatingMenu
                                        open={floatingMenuOpen}
                                        onClose={closeFloatingMenu}
                                        returnFocus={floatingMenuTrigger}
                                        position={floatingMenuPosition}
                                    />
                                </div>
                                <h3 data-text="subheading">버튼에서 펼쳐지고, 버튼으로 돌아갑니다</h3>
                                <p data-text="body">
                                    WebGL의 32 × 22 메시가 실제 목록 텍스처를 휘며 펼쳐집니다.
                                    버튼에서 먼 모서리가 조금 늦게 따라오고, 마지막에는 탄성으로
                                    자리 잡습니다. 닫기는 현재 위치에서 실제 호출 버튼으로
                                    되돌아가는 역방향 동작입니다. 도중에 다시 눌러도 위치와 속도를
                                    이어갑니다.
                                </p>
                                <h3 data-text="subheading">작은 화면에서는 왼쪽 서랍으로</h3>
                                <p data-text="body">
                                    700px 이하에서 전체 메뉴는 왼쪽 벽에 붙는 세로 목록으로 바뀝니다.
                                    그룹을 펼쳐 탐색하고, 창 안에서 스크롤합니다. 이동 버튼과 자유
                                    드래그는 이 화면에서 제공하지 않습니다. 같은 WebGL 탄성이 왼쪽에서
                                    펼쳐지고 다시 벽 안으로 들어가며, drawer 재질의 더 높은 불투명도와
                                    강한 굴절로 목록의 가독성을 지킵니다.
                                </p>
                                <DataTable
                                    label="FloatingPanel 컴포넌트 속성"
                                    headings={["속성", "역할"]}
                                    rows={[
                                        ["variant", "floating · 자유 이동 / drawer · 왼쪽 고정 서랍"],
                                        [
                                            "open / onClose",
                                            "열림을 제어하며, 퇴장이 끝날 때까지 창을 유지합니다",
                                        ],
                                        ["anchorRef", "등장과 복귀의 기준이 되는 버튼 ref"],
                                        [
                                            "title / eyebrow / closeLabel / moveLabel",
                                            "창 제목·맥락·닫기와 이동 버튼의 접근 가능한 이름",
                                        ],
                                        [
                                            "position",
                                            "드래그한 위치를 닫았다 열어도 유지하는 ref · 선택",
                                        ],
                                        ["children", "스크롤할 목록이나 상세 콘텐츠"],
                                        ["className / id", "표면 크기와 식별자"],
                                    ]}
                                />
                                <pre data-text="body" className="ds-code-block">
                                    <code data-text="meta">{`import FloatingPanel from "@/components/FloatingPanel";\n\n<FloatingPanel\n    open={open}\n    onClose={() => setOpen(false)}\n    anchorRef={buttonRef}\n    title="목록"\n>\n    <nav className="glass-menu-content" aria-label="목록">\n        <a href="/v5/programs/">프로그램</a>\n    </nav>\n</FloatingPanel>`}</code>
                                </pre>
                                <p data-text="caption" className="ds-caption">
                                    이동 중에는 WebGL이 시각적 전환을 담당하고, 정착하면 실제 HTML
                                    링크와 버튼을 사용합니다. 모션 감소 설정에서는 짧은 페이드만
                                    사용하며, WebGL을 사용할 수 없어도 창의 조작은 유지합니다.
                                </p>
                                <DataTable
                                    label="떠 있는 메뉴의 표면과 위계"
                                    headings={["역할", "기준", "토큰"]}
                                    rows={[
                                        [
                                            "창 제목",
                                            `${DESIGN_TOKEN_VALUES["--text-title"]} · ${DESIGN_TOKEN_VALUES["--weight-heading"]}`,
                                            "--text-title",
                                        ],
                                        [
                                            "메뉴 그룹",
                                            `${DESIGN_TOKEN_VALUES["--text-menu-group"]} · ${DESIGN_TOKEN_VALUES["--weight-heading"]}`,
                                            "--text-menu-group",
                                        ],
                                        [
                                            "탐색 링크",
                                            `${tokenPixels("--text-menu-link")} · ${DESIGN_TOKEN_VALUES["--weight-label"]} · 조작 높이 ${tokenPixels("--control-size")}`,
                                            "--text-menu-link",
                                        ],
                                        ["설명·개인 서비스", `${tokenPixels("--text-sm")} · ${DESIGN_TOKEN_VALUES["--weight-body"]}–${DESIGN_TOKEN_VALUES["--weight-label"]}`, "--text-sm"],
                                        ["모서리", tokenPixels("--radius-dialog"), "--radius-dialog"],
                                        [
                                            "유리 바탕",
                                            `흰색 ${Math.round(GLASS_MATERIALS.surface.opacity * 100)}% + 방향성 반사광`,
                                            "--glass-opacity / --glass-tint",
                                        ],
                                        [
                                            "굴절·두께",
                                            `굴절 ${GLASS_MATERIALS.surface.refraction} · 가장자리 ${GLASS_MATERIALS.surface.thickness}px`,
                                            "--glass-refraction / --glass-thickness",
                                        ],
                                        [
                                            "배경 흐림",
                                            `${GLASS_MATERIALS.surface.blur}px · 채도 ${DESIGN_TOKEN_VALUES["--glass-saturation"]}배`,
                                            "--glass-blur / --glass-saturation",
                                        ],
                                        [
                                            "테두리·그림자",
                                            DESIGN_TOKEN_VALUES["--glass-edge"],
                                            "--glass-edge / --glass-shadow",
                                        ],
                                    ]}
                                />
                                <ul className="ds-rules-list">
                                    <li data-text="body">
                                        마우스로 글자와 여백을 잡아 옮깁니다. 드래그한 링크는 열리지
                                        않습니다.
                                    </li>
                                    <li data-text="body">
                                        터치에서는 제목을 잡아 옮깁니다. 본문은 세로로 스크롤하며,
                                        이동 버튼을 켜면 본문에서도 창을 옮길 수 있습니다.
                                    </li>
                                    <li data-text="body">
                                        이동 버튼에 초점을 두고 방향키로 16px, Shift와 함께 4px씩
                                        옮깁니다. Home은 처음 위치, Escape는 닫기입니다.
                                    </li>
                                    <li data-text="body">
                                        배경 페이지도 사용할 수 있습니다. 화면 크기가 바뀌어도
                                        닫기와 탐색을 화면 안에 유지합니다.
                                    </li>
                                    <li data-text="body">
                                        투명도 감소·고대비 설정에서는 흰 불투명 표면으로 전환합니다.
                                    </li>
                                </ul>
                            </>,
                        )}
                        {section(
                            "small-notification",
                            "알림소형모달",
                            <>
                                <p data-text="body">
                                    v4의 둥근 하단 알림을 공통 컴포넌트로 등록했습니다.
                                    관심 등록·해제처럼 짧은 결과를 전달하며, 배경을 가리거나
                                    초점을 옮기지 않습니다. 3.5초 뒤 부드럽게 사라지고,
                                    새 알림은 같은 캡슐 안에서 갱신됩니다.
                                </p>
                                <div className="ds-demo-actions">
                                    <SystemButton data-text="action" onClick={() => showSmallNotification("관심 프로그램에 저장했어요.")}>
                                        알림소형모달 보기
                                    </SystemButton>
                                    <SystemButton data-text="action" variant="quiet" onClick={() => showSmallNotification("관심 프로그램에서 삭제했어요.")}>
                                        다음 알림으로 교체
                                    </SystemButton>
                                </div>
                                <DataTable label="알림소형모달 컴포넌트 속성"
                                    headings={["속성", "역할"]}
                                    rows={[
                                        ["open / message", "표시 상태와 안내 문장"],
                                        ["id", "여러 표면을 구분하는 식별자 · 선택"],
                                        ["SmallNotificationModalHost", "사이트에 한 번 등록하는 알림 호스트"],
                                        ["showSmallNotification(message)", "어느 화면에서든 알림을 표시"],
                                        ["duration", "호스트의 표시 시간 · 기본 3500ms"],
                                    ]}
                                />
                                <pre data-text="body" className="ds-code-block"><code data-text="meta">{`import SmallNotificationModal, {\n    showSmallNotification\n} from "@/components/SmallNotificationModal";\n\nshowSmallNotification("관심 프로그램에 저장했어요.");\n\n// 직접 상태를 제어하는 경우\n<SmallNotificationModal open={visible} message="저장했어요." />`}</code></pre>
                                <p data-text="caption" className="ds-caption">
                                    양끝은 완전한 캡슐이며, 글자는 최소 16px로 유지합니다.
                                    모션 감소 설정에서는 위치 이동 없이 페이드만 사용합니다.
                                </p>
                            </>,
                        )}
                        {section(
                            "feedback",
                            "상태와 대화상자",
                            <>
                                <p data-text="body">SystemNotice는 LiquidGlass의 white 베리언트를 조합합니다. default·flow 레이아웃과 status·error 상태는 같은 흰 유리 재질을 사용합니다.</p>
                                <div className="ds-demo-stack">
                                    <div className="ds-demo-row">
                                        <SystemBadge data-text="meta">안내</SystemBadge>
                                        <SystemBadge data-text="meta" tone="highlight">추천</SystemBadge>
                                        <SystemBadge data-text="meta" tone="info">접근성 제공</SystemBadge>
                                    </div>
                                    <SystemNotice data-text="body" title="관심 프로그램에 저장했습니다.">
                                        저장한 프로그램은 마이페이지에서 다시 확인할 수 있습니다.
                                    </SystemNotice>
                                    <SystemNotice data-text="body" title="입력 내용을 확인해 주세요." error>
                                        이메일 주소를 입력하면 다음 단계로 이동할 수 있습니다.
                                    </SystemNotice>
                                </div>
                                <h3 data-text="subheading">확인이 필요한 선택</h3>
                                <p data-text="caption" className="ds-caption">
                                    모달은 배경을 잠그고, Esc로 닫은 뒤 열었던 버튼으로 초점을
                                    돌려줍니다.
                                </p>
                                <SystemButton data-text="action"
                                    variant="secondary"
                                    onClick={() => demoDialog.current?.showModal()}
                                >
                                    날짜 선택 대화상자 열기
                                </SystemButton>
                            </>,
                        )}
                    </>
                );
            case "motion":
                return (
                    <>
                        {section(
                            "timing",
                            "시간과 이징",
                            <>
                                <p data-text="body">
                                    조작의 결과는 짧게, 화면의 관계는 조금 여유 있게 보여줍니다.
                                    일반 버튼은 위치를 움직이지 않고 색과 명도로 응답합니다.
                                </p>
                                <DataTable
                                    label="모션 시간과 역할"
                                    headings={["역할", "토큰", "값", "사용"]}
                                    rows={[
                                        [
                                            "즉각적인 반응",
                                            "--duration-fast",
                                            DESIGN_TOKEN_VALUES["--duration-fast"],
                                            "작은 상태 변화",
                                        ],
                                        [
                                            "조작 피드백",
                                            "--duration-feedback",
                                            DESIGN_TOKEN_VALUES["--duration-feedback"],
                                            "버튼·레이블",
                                        ],
                                        ["패널 전환", "--duration-panel", DESIGN_TOKEN_VALUES["--duration-panel"], "모달·펼침"],
                                        [
                                            "기본 곡선",
                                            "--ease-standard",
                                            DESIGN_TOKEN_VALUES["--ease-standard"],
                                            "빠르게 반응하고 부드럽게 종료",
                                        ],
                                    ]}
                                />
                            </>,
                        )}
                        {section(
                            "scroll",
                            "글자별 스크롤 등장 · Deprecated",
                            <>
                                <p data-text="body">
                                    Deprecated — 홈에서 사용을 종료한 이전 글자 모션입니다.
                                    실행 예제와 구현은 활성 컴포넌트에서 제거했습니다.
                                    현재 홈의 ‘관람 예약’은 스크롤 위치와 관계없이 읽을 수 있는
                                    정적 공통 제목을 사용합니다.
                                </p>
                                <SystemNotice data-lifecycle="deprecated" title="BookingInvitation · Deprecated">
                                    이전 구현은 Git 이력에서 확인할 수 있습니다. 신규 화면은 SystemText의 정적 제목을 사용합니다.
                                </SystemNotice>
                                <div className="ds-inline-links">
                                    <Link data-text="action" href="/">
                                        홈의 정적 관람 예약 제목 보기
                                        <Icon name="diagonal" size={20} />
                                    </Link>
                                </div>
                            </>,
                        )}
                        {section(
                            "quick-menu",
                            "원형 퀵메뉴",
                            <>
                                <p data-text="body">
                                    브랜드 노랑과 전용 초록이 원 안에서 천천히 흐릅니다.
                                    털이나 입자 없이 매끈한 표면으로 표현하고, 포인터와 회전 방향에
                                    맞춰 물결이 부드럽게 반응합니다.
                                </p>
                                <div className="ds-quick-menu">
                                    <VioletQuickMenu placement="inline" items={inlineMenuItems} />
                                </div>
                                <ul className="ds-rules-list">
                                    <li data-text="body">
                                        클릭·터치·키보드로 열고, 방향키로 항목을 고른 뒤 Enter로
                                        이동합니다.
                                    </li>
                                    <li data-text="body">
                                        원을 돌려 놓으면 선택 위치에 정렬됩니다. 놓기만 해서는
                                        이동하지 않습니다.
                                    </li>
                                    <li data-text="body">
                                        색상은 QUICK_MENU_MATERIAL의 노랑·레몬·초록·민트를
                                        사용합니다. 기본 흐름은 14초 주기이며 화면 밖에서는 그리기를 멈춥니다.
                                    </li>
                                    <li data-text="body">
                                        동작 줄이기에서는 장식 움직임을 멈추고 탐색 기능은
                                        유지합니다.
                                    </li>
                                </ul>
                            </>,
                        )}
                    </>
                );
            case "accessibility":
                return (
                    <>
                        {section(
                            "reading",
                            "읽기",
                            <>
                                <p data-text="body">
                                    일반 정보는 16px 이상으로 읽습니다. 이미지 안의 글자와 실제 UI
                                    레이블을 구분하고, 중요한 안내를 작거나 흐리게 숨기지 않습니다.
                                </p>
                                <ul className="ds-rules-list">
                                    <li data-text="body">제목은 h1 → h2 → h3 순서로 구성합니다.</li>
                                    <li data-text="body">본문과 배경의 대비는 4.5:1 이상으로 확인합니다.</li>
                                    <li data-text="body">
                                        화면을 확대해도 본문은 줄바꿈하고, 표는 이름이 있는 내부
                                        영역에서 스크롤합니다.
                                    </li>
                                    <li data-text="body">
                                        사진에는 목적에 맞는 대체 설명을 제공하고 장식 아이콘은
                                        숨깁니다.
                                    </li>
                                </ul>
                            </>,
                        )}
                        {section(
                            "interaction",
                            "조작",
                            <>
                                <div className="ds-demo-row">
                                    <SystemButton data-text="action" variant="secondary">
                                        Tab으로 초점 확인
                                    </SystemButton>
                                    <SystemButton data-text="action" variant="primary">Enter로 실행</SystemButton>
                                </div>
                                <ul className="ds-rules-list">
                                    <li data-text="body">일반 조작 영역은 48px를 기본으로 확보합니다.</li>
                                    <li data-text="body">초점은 3px 안쪽 선과 -3px offset으로 표시합니다.</li>
                                    <li data-text="body">
                                        열리는 메뉴와 모달은 닫기·Esc·초점 복귀를 함께 제공합니다.
                                    </li>
                                    <li data-text="body">
                                        모션 감소 설정을 따르고, 스크롤 모션은 입력 없이 계속
                                        재생하지 않습니다.
                                    </li>
                                    <li data-text="body">
                                        색만으로 상태를 표현하지 않고 텍스트·아이콘·aria 속성을 함께
                                        갱신합니다.
                                    </li>
                                </ul>
                            </>,
                        )}
                        {section(
                            "writing",
                            "문장과 상태 표현",
                            <>
                                <DataTable
                                    label="안내 문장과 상태 표현 기준"
                                    headings={["상황", "사용할 문장", "기준"]}
                                    rows={[
                                        [
                                            "행동",
                                            "예매하기 · 일정 찾기",
                                            "행동과 대상을 구체적으로",
                                        ],
                                        [
                                            "입력 오류",
                                            "이메일 주소를 끝까지 입력해 주세요.",
                                            "원인과 해결 행동을 함께",
                                        ],
                                        [
                                            "빈 결과",
                                            "조건에 맞는 공연이 없습니다. 날짜를 바꿔보세요.",
                                            "현재 상황과 다음 선택",
                                        ],
                                        [
                                            "저장 완료",
                                            "예매 내용을 저장했습니다. 마이페이지에서 확인할 수 있습니다.",
                                            "실제 처리 범위를 정확하게",
                                        ],
                                    ]}
                                />
                            </>,
                        )}
                    </>
                );
            case "resources":
                return (
                    <>
                        {section(
                            "tokens",
                            "토큰 내보내기",
                            <>
                                <p data-text="body">
                                    컬러·타이포그래피·조작 크기·모션의 기준을 CSS 변수로 적용합니다.
                                    실제 제품의 원본은 tokens.css와 defaults.css입니다.
                                </p>
                                <div className="ds-demo-row ds-no-print">
                                    <SystemButton data-text="action" onClick={downloadTokens}>
                                        <Icon name="download" size={20} />
                                        토큰 CSS 다운로드
                                    </SystemButton>
                                    <SystemButton data-text="action"
                                        variant="secondary"
                                        onClick={() => copyValue(designTokensCss(), "디자인 토큰")}
                                    >
                                        {copied === "디자인 토큰" ? "복사됨" : "전체 코드 복사"}
                                    </SystemButton>
                                </div>
                                <pre data-text="body" className="ds-code-block">
                                    <code data-text="meta">{designTokensCss()}</code>
                                </pre>
                            </>,
                        )}
                        {section(
                            "assets",
                            "브랜드 자료",
                            <>
                                <p data-text="body">
                                    원본 로고와 설치된 서체를 사용합니다. 로고는 생성하거나 비율을
                                    바꾸지 않습니다.
                                </p>
                                <div className="ds-inline-links">
                                    <a data-text="action" href="/v5/assets/images/sejong-wordmark.png" download>
                                        워드마크 PNG
                                        <Icon name="download" size={20} />
                                    </a>
                                    <a data-text="action" href="/v5/assets/images/sejong-official-symbol.png" download>
                                        심벌 PNG
                                        <Icon name="download" size={20} />
                                    </a>
                                    <a data-text="action" href="/v5/assets/fonts/README.md">
                                        서체와 라이선스 안내
                                        <Icon name="diagonal" size={20} />
                                    </a>
                                </div>
                                <p data-text="caption" className="ds-caption">
                                    워드마크는 세종문화회관의 기존 공식 소스에서 추출한 파일입니다.
                                    재사용 시 원 권리자의 사용 조건을 확인합니다.
                                </p>
                                <SystemButton data-text="action"
                                    variant="secondary"
                                    className="ds-no-print"
                                    onClick={() => window.print()}
                                >
                                    현재 문서 인쇄
                                </SystemButton>
                            </>,
                        )}
                        {section(
                            "references",
                            "참고 기준",
                            <>
                                <ul className="ds-rules-list">
                                    <li data-text="body">
                                        <a data-text="action"
                                            href="https://www.sejongpac.or.kr/portal/main/main.do"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            세종문화회관 원본 브랜드와 서비스 (새 창)
                                        </a>
                                    </li>
                                    <li data-text="body">
                                        <a data-text="action"
                                            href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            W3C WCAG 2.2 명도 대비 기준 (새 창)
                                        </a>
                                    </li>
                                    <li data-text="body">
                                        사용자가 제시한 문서형 가이드의 분류·본문·목차 구조를 v5의
                                        정보와 컬러로 구성했습니다.
                                    </li>
                                </ul>
                            </>,
                        )}
                    </>
                );
        }
    };

    return (
        <div className="design-system-page">
            <header className="ds-doc-header">
                <Link data-text="action" className="ds-doc-brand" href="/" aria-label="세종문화회관 홈">
                    <img
                        src="/v5/assets/images/sejong-wordmark.png"
                        width={158}
                        height={29}
                        alt="세종문화회관"
                    />
                    <span data-text="body">디자인 시스템</span>
                </Link>
                <div className="ds-doc-actions">
                    <button data-text="action"
                        type="button"
                        className="ds-search-trigger"
                        aria-label="디자인 가이드 검색"
                        aria-haspopup="dialog"
                        onClick={() => searchDialog.current?.showModal()}
                    >
                        <Icon name="search" size={20} />
                        <span data-text="body">가이드 검색</span>
                        <kbd data-text="meta">Ctrl K</kbd>
                    </button>
                    <Link data-text="action" className="ds-site-link" href="/">
                        사이트 보기
                        <Icon name="diagonal" size={20} />
                    </Link>
                    <SystemButton data-text="action"
                        className="ds-menu-trigger"
                        variant="quiet"
                        aria-label="디자인 시스템 목차 열기"
                        aria-haspopup="dialog"
                        onClick={() => navigationDialog.current?.showModal()}
                    >
                        <Icon name="menu" size={24} />
                    </SystemButton>
                </div>
            </header>
            <aside data-text="body" className="ds-sidebar">
                {navigationLinks()}
                <p data-text="body" className="ds-sidebar-note">
                    v5 · 디지털 사용 기준
                    <br />
                    본문 16px · 기존 컬러 유지
                </p>
            </aside>
            <div className="ds-content-area">
                <div className="ds-doc-layout">
                    <main data-text="body" id="main" tabIndex={-1} className="ds-document">
                        <nav className="ds-breadcrumbs" aria-label="문서 위치">
                            <a data-text="action"
                                href="#overview"
                                onClick={(event) => navigate("overview", "", event)}
                            >
                                가이드
                            </a>
                            <span data-text="body" aria-hidden="true">/</span>
                            <span data-text="body">{chapter.label}</span>
                        </nav>
                        <div className="ds-page-heading">
                            <p data-text="body" className="ds-version">v5 · 2026.10</p>
                            <h1 data-text="title" id="doc-page-title" tabIndex={-1}>
                                {chapterId === "overview"
                                    ? "세종문화회관 디자인 시스템"
                                    : chapter.label}
                            </h1>
                            <p data-text="body">
                                {chapterId === "overview"
                                    ? "브랜드 컬러부터 한 글자의 간격까지. v5 화면을 만들고 확인할 때 사용하는 기준입니다."
                                    : chapter.description}
                            </p>
                        </div>
                        <p data-text="body" className="ds-feedback-line" role="status" aria-live="polite">
                            {message}
                        </p>
                        {renderChapter()}
                        <nav data-text="body" className="ds-chapter-footer" aria-label="이전 다음 문서">
                            {chapterIndex > 0 && (
                                <a data-text="action"
                                    href={`#${CHAPTERS[chapterIndex - 1].id}`}
                                    onClick={(event) =>
                                        navigate(CHAPTERS[chapterIndex - 1].id, "", event)
                                    }
                                >
                                    <span data-text="body">이전</span>
                                    <strong data-text="item-title">{CHAPTERS[chapterIndex - 1].label}</strong>
                                </a>
                            )}
                            {chapterIndex < CHAPTERS.length - 1 && (
                                <a data-text="action"
                                    href={`#${CHAPTERS[chapterIndex + 1].id}`}
                                    onClick={(event) =>
                                        navigate(CHAPTERS[chapterIndex + 1].id, "", event)
                                    }
                                >
                                    <span data-text="body">다음</span>
                                    <strong data-text="item-title">{CHAPTERS[chapterIndex + 1].label}</strong>
                                </a>
                            )}
                        </nav>
                    </main>
                    <nav data-text="body" className="ds-outline" aria-label="현재 문서 목차">
                        <p data-text="body">이 문서의 내용</p>
                        {chapter.sections.map(([id, label]) => (
                            <a data-text="action"
                                href={`#${chapterId}/${id}`}
                                key={id}
                                aria-current={
                                    activeSection === `${chapterId}-${id}` ? "location" : undefined
                                }
                                onClick={(event) => navigate(chapterId, id, event)}
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>

            <SystemDialog
                ref={searchDialog}
                className="ds-search-dialog"
                aria-labelledby="doc-search-title"
                closeOnBackdrop={false}
            >
                <div className="ds-dialog-heading">
                    <h2 data-text="heading" id="doc-search-title">가이드 검색</h2>
                    <SystemButton data-text="action"
                        variant="quiet"
                        className="ds-dialog-close"
                        aria-label="검색 닫기"
                        onClick={() => searchDialog.current?.close()}
                    >
                        <Icon name="close" size={24} />
                    </SystemButton>
                </div>
                <SystemField data-text="body"
                    id="doc-search"
                    label="찾을 기준"
                    placeholder="예: 컬러, 16px, 모션"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoFocus
                />
                <DeepSearchDisclosure title="대화로 디자인 기준 검색"
                    onSearch={term => contextSearchReply(term, searchEntries.map(entry => ({
                        title: entry.title,
                        description: entry.description,
                        href: "#" + entry.chapter + (entry.anchor ? "/" + entry.anchor : ""),
                    })), "디자인 기준")}
                />
                <div data-text="body" className="ds-search-results">
                    {results.length ? (
                        results.map((result) => (
                            <a data-text="action"
                                key={result.chapter + result.anchor + result.title}
                                href={`#${result.chapter}${result.anchor ? "/" + result.anchor : ""}`}
                                onClick={(event) => navigate(result.chapter, result.anchor, event)}
                            >
                                <div>
                                    <strong data-text="item-title">{result.title}</strong>
                                    <span data-text="body">{result.description}</span>
                                </div>
                                <Icon name="chevron" size={20} />
                            </a>
                        ))
                    ) : (
                        <SystemNotice data-text="body" title="찾는 기준이 없습니다.">
                            검색어를 짧게 바꾸거나 왼쪽 분류에서 확인해 주세요.
                        </SystemNotice>
                    )}
                </div>
            </SystemDialog>
            <SystemDialog
                ref={navigationDialog}
                className="ds-navigation-dialog"
                aria-labelledby="doc-navigation-title"
                closeOnBackdrop={false}
            >
                <div className="ds-dialog-heading">
                    <h2 data-text="heading" id="doc-navigation-title">디자인 시스템</h2>
                    <SystemButton data-text="action"
                        variant="quiet"
                        className="ds-dialog-close"
                        aria-label="목차 닫기"
                        onClick={() => navigationDialog.current?.close()}
                    >
                        <Icon name="close" size={24} />
                    </SystemButton>
                </div>
                {navigationLinks(true)}
            </SystemDialog>
            <SystemDialog
                ref={demoDialog}
                aria-labelledby="sample-dialog-title"
                closeOnBackdrop={false}
            >
                <div className="ds-dialog-heading">
                    <h2 data-text="heading" id="sample-dialog-title">관람할 날짜를 선택해 주세요</h2>
                    <SystemButton data-text="action"
                        variant="quiet"
                        className="ds-dialog-close"
                        aria-label="날짜 선택 닫기"
                        onClick={() => demoDialog.current?.close()}
                    >
                        <Icon name="close" size={24} />
                    </SystemButton>
                </div>
                <SystemField data-text="body"
                    id="sample-date"
                    label="관람일"
                    type="date"
                    value={demoDate}
                    onChange={(event) => setDemoDate(event.target.value)}
                />
                <p data-text="body">디자인 컴포넌트를 확인하는 예제입니다. 실제 예매에는 반영되지 않습니다.</p>
                <div className="ds-dialog-actions">
                    <SystemButton data-text="action" variant="secondary" onClick={() => demoDialog.current?.close()}>
                        취소
                    </SystemButton>
                    <SystemButton data-text="action"
                        onClick={() => {
                            setMessage(
                                demoDate
                                    ? `${demoDate}을 선택했습니다.`
                                    : "관람일을 선택해 주세요.",
                            );
                            if (demoDate) demoDialog.current?.close();
                        }}
                    >
                        선택 적용
                    </SystemButton>
                </div>
            </SystemDialog>
        </div>
    );
}
