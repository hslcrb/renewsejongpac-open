"use client";

import { useState, useRef } from "react";
import { COMPONENT_REGISTRY, CONTROL_EXCEPTIONS } from "../../../src/data/component-registry";
import { COMPONENT_COUNTS, COMPONENT_USAGE } from "../../../src/data/component-usage";
import { HOME_FEATURES } from "../../../src/data/home-features";
import { PROGRAMS } from "../../../src/data/catalog";
import { mediaPath } from "../../../src/lib/media";
import HeroSlide from "../../../components/HeroSlide";
import LiquidGlass from "../../../components/LiquidGlass";
import FloatingPanel from "../../../components/FloatingPanel";
import type { GlassMaterialVariant } from "../../../src/data/design-tokens";
import type { PanelVariant } from "../../../src/lib/floating-panel";
import HeroCompanion from "../../../components/HeroCompanion";
import SeasonBanner from "../../../components/SeasonBanner";
import { BookingCalendar, BookingProgramChoice } from "../../../components/HomeBookingControls";
import { SystemButton, SystemCheckbox, SystemField, SystemIconButton, SystemLink, SystemFilterButton, SystemBadge, SystemNotice } from "../../../components/SystemPrimitives";
import Icon from "../../../components/Icon";
import AccountMiniRoom from "../../../components/AccountMiniRoom";
import { AccountDiary, AccountMembershipCard, AccountTicket } from "../../../components/AccountPanels";
import { validateAccountNote } from "../../../src/lib/account-space.ts";
import type { AccountNote, AccountTheme } from "../../../src/lib/account-space.ts";
import { showSmallNotification } from "../../../components/SmallNotificationModal";

import { SystemText } from "../../../components/SystemText";
import DeepSearchDisclosure from "../../../components/DeepSearchDisclosure";
import { contextSearchReply } from "../../../components/DeepSearch";
import { SystemSurface } from "../../../components/SystemSurface";
import { SystemTabs, SystemDisclosure } from "../../../components/SystemNavigation";
import type { SystemControlStyle } from "../../../components/SystemPrimitives";
import type { TextVariant, TextSize } from "../../../components/SystemText";
import type { SystemSurfaceVariant, SystemSurfacePadding, SystemSurfaceRadius } from "../../../components/SystemSurface";
import type { BadgeTone, Appearance, TabOrientation, ComponentExample } from "../../../src/system/component-contracts";

const kinds = { ui: "재사용 UI", structure: "구조·페이지 연결", internal: "내부 지원", demo: "문서 도구" };
const statuses = { product: "제품 연결", "guide-only": "가이드 전용", unused: "미사용" };

// [등록된 실제 컴포넌트 / The registered production components]
// 샘플 마크업을 다시 만들지 않고 제품과 같은 구현을 렌더링합니다.
// Render the production implementation instead of copying sample markup.
export default function ComponentCatalog() {
    const floatingAnchor = useRef<HTMLButtonElement>(null);
    const drawerAnchor = useRef<HTMLButtonElement>(null);
    const [query, setQuery] = useState("");
    const [exampleValues, setExampleValues] = useState<Record<string, string>>({});
    const updateExample = (id: string, value: string) => setExampleValues(current => ({...current, [id]: value}));
    const [preview, setPreview] = useState("");
    const [month, setMonth] = useState("2026-10");
    const [date, setDate] = useState("2026-10-21");
    const [selected, setSelected] = useState(false);
    const [consent, setConsent] = useState(false);
    const [roomLight, setRoomLight] = useState(true);
    const [roomTheme, setRoomTheme] = useState<AccountTheme>("paper");
    const [accountNotes, setAccountNotes] = useState<AccountNote[]>([]);
    const entries = COMPONENT_REGISTRY.filter(entry => `${entry.name} ${entry.purpose} ${entry.source}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const previewEntry = COMPONENT_REGISTRY.find(entry => entry.id === preview);

    // [열거값마다 실제 구현을 렌더링 / Render the actual implementation for each allowed value]
    function renderExample(component: string, example: ComponentExample) {
        const value = example.value;
        if (component === "icon") return value === "header-action" ? <><Icon name="search" group="header-action" /><Icon name="menu" group="header-action" /></> : <Icon name="search" />;
        const state = example.state;
        const styles: SystemControlStyle = {
            ...(example.axis === "variant" ? {variant: value as SystemControlStyle["variant"]} : {}),
            ...(example.axis === "context" ? {context: value as SystemControlStyle["context"]} : {}),
            ...(example.axis === "shape" ? {shape: value as SystemControlStyle["shape"]} : {}),
        };
        const text = `${component} · ${example.axis || "state"}: ${value || state}`;
        if (component === "text") return <SystemText ref={element => element?.setAttribute("data-ref-forwarded", "true")} variant={example.axis === "variant" ? value as TextVariant : "body"} size={example.axis === "size" ? value as TextSize : undefined}>예술을 만나는 날</SystemText>;
        if (component === "surface") return <SystemSurface ref={element => element?.setAttribute("data-ref-forwarded", "true")} variant={example.axis === "variant" ? value as SystemSurfaceVariant : "panel"} padding={example.axis === "padding" ? value as SystemSurfacePadding : "md"} radius={example.axis === "radius" ? value as SystemSurfaceRadius : "panel"}><p data-text="body">콘텐츠를 담는 공통 표면</p></SystemSurface>;
        if (component === "button-link") return <SystemLink {...styles} href="/programs/" aria-label={styles.shape === "circle" ? "프로그램 이동" : undefined}>{styles.shape === "circle" ? <Icon name="arrow" /> : "프로그램 이동"}</SystemLink>;
        if (component === "button") return <SystemButton {...styles} disabled={state === "disabled"} aria-label={styles.shape === "circle" ? "가이드 버튼 실행" : undefined} aria-pressed={state === "pressed" ? exampleValues[example.id] !== "false" : undefined} onClick={() => state === "pressed" ? updateExample(example.id, exampleValues[example.id] === "false" ? "true" : "false") : showSmallNotification("가이드 버튼을 실행했어요.")}>{styles.shape === "circle" ? <Icon name="plus" /> : "공통 버튼"}</SystemButton>;
        if (component === "icon-button") return <SystemIconButton {...styles} disabled={state === "disabled"} aria-label={text} aria-pressed={state === "pressed" ? exampleValues[example.id] !== "false" : undefined} onClick={() => state === "pressed" ? updateExample(example.id, exampleValues[example.id] === "false" ? "true" : "false") : showSmallNotification("가이드 버튼을 실행했어요.")}><Icon name="plus" /></SystemIconButton>;
        if (component === "filter-button") return <SystemFilterButton {...styles} aria-label={styles.shape === "circle" ? "공연 필터" : undefined} selected={exampleValues[example.id] ? exampleValues[example.id] === "true" : value === "true"} disabled={state === "disabled"} onClick={() => updateExample(example.id, (exampleValues[example.id] ? exampleValues[example.id] === "true" : value === "true") ? "false" : "true")}>{styles.shape === "circle" ? <Icon name="check" /> : "공연 필터"}</SystemFilterButton>;
        if (component === "field") {
            const common = {label: text, disabled: state === "disabled", required: state === "required", error: state === "error" ? "입력한 값을 확인해 주세요." : undefined, variant: example.axis === "variant" ? value as "default" | "flow" : "default" as const};
            if (value === "select") return <SystemField {...common} as="select" defaultValue="performance"><option data-text="label" value="performance">공연</option><option data-text="label" value="exhibition">전시</option></SystemField>;
            if (value === "textarea") return <SystemField {...common} as="textarea" defaultValue="관람 후 감상을 남겨 주세요." />;
            return <SystemField {...common} readOnly={state === "readonly"} defaultValue={state === "readonly" ? "읽기 전용" : undefined} placeholder="내용을 입력하세요" />;
        }
        if (component === "checkbox") return <SystemCheckbox label={text} disabled={state === "disabled"} defaultChecked={state === "checked"} />;
        if (component === "badge") return <SystemBadge tone={example.axis === "tone" ? value as BadgeTone : "neutral"} appearance={example.axis === "appearance" ? value as Appearance : "default"}>공연 안내</SystemBadge>;
        if (component === "notice") return <SystemNotice ref={element => element?.setAttribute("data-ref-forwarded", "true")} variant={example.axis === "variant" ? value as "default" | "flow" : "default"} error={state === "error"} title="처리 결과">{state === "error" ? "입력값을 확인해 주세요." : "요청을 확인했어요."}</SystemNotice>;
        if (component === "tabs") return <SystemTabs aria-label={text} orientation={example.axis === "orientation" ? value as TabOrientation : "horizontal"} value={exampleValues[example.id] || "performance"} onValueChange={next => updateExample(example.id, next)} items={[{id:"performance",label:"공연",content:<p data-text="body">프로그램 일정</p>},{id:"exhibition",label:"전시",content:<p data-text="body">전시 일정</p>},{id:"disabled",label:"준비 중",content:null,disabled:true}]} />;
        if (component === "disclosure") return <SystemDisclosure summary="관람 안내 펼치기" appearance={example.axis === "appearance" ? value as Appearance : "default"} open={exampleValues[example.id] ? exampleValues[example.id] === "true" : state === "open"} onToggle={event => updateExample(example.id, String(event.currentTarget.open))}><p data-text="body">공연 시작 전에 입장해 주세요.</p></SystemDisclosure>;
        if (component === "hero-slide") return <div className="home-v4-wrap component-hero-preview"><HeroSlide idPrefix={example.id} feature={HOME_FEATURES[0]} active={example.axis !== "preview"} preview={example.axis === "preview" ? value as "previous" | "next" : undefined} entering={state === "entering"} layout={example.axis === "layout" ? value as "standalone" | "with-companion" : "standalone"} onSelect={() => showSmallNotification("히어로 미리보기입니다.")} /></div>;
        if (component === "account-mini-room") return <AccountMiniRoom name="관람객" message="가이드 예시 공간" theme={example.axis === "theme" ? value as AccountTheme : "paper"} lightOn={exampleValues[example.id] ? exampleValues[example.id] === "true" : state !== "light-off"} programs={PROGRAMS.slice(0, 3)} hasFavorites={false} onToggleLight={() => updateExample(example.id, (exampleValues[example.id] ? exampleValues[example.id] === "true" : state !== "light-off") ? "false" : "true")} />;
        if (component === "account-membership") return <AccountMembershipCard name="가이드 관람객" message="인증 상태별 표시 예시" mode={value as "loading" | "guest" | "demo" | "oauth"} counts={{upcoming:0,favorites:0,notes:0}} onEdit={() => showSmallNotification("프로필 편집 예시입니다.")} onLogout={() => showSmallNotification("로그아웃 예시입니다. 인증은 변경하지 않아요.")} />;
        if (component === "account-ticket") return <AccountTicket variant={example.axis === "variant" ? value as "compact" | "full" : "full"} program={PROGRAMS[0]} booking={{id:example.id,programId:PROGRAMS[0].id,title:PROGRAMS[0].title,date:"2026-11-20",time:"19:30",venue:PROGRAMS[0].venue || "세종문화회관",seats:["A1"],total:70000,reference:"GUIDE",status: state === "cancelled" ? "cancelled" : "reserved_unpaid"}} onCancel={() => showSmallNotification("가이드 예시입니다. 실제 예매 기록은 변경되지 않아요.")} />;
        if (component === "glass") return <div className="ds-glass-stage"><img src="/v5/assets/images/sejong-grand-interior.png" alt="" className="ds-glass-backdrop" /><LiquidGlass variant={value as GlassMaterialVariant} className="ds-glass-example"><h4 data-text="item-title">공통 유리 재질</h4><p data-text="body">variant: {value}</p></LiquidGlass></div>;
        if (component === "header") {
            const route = value === "inverse" ? "/v5/about/introduction/" : "/v5/";
            return <div className="component-route-preview"><SystemButton variant="secondary" onClick={() => updateExample(example.id, exampleValues[example.id] === "true" ? "false" : "true")}>{value === "inverse" ? "반전 헤더 확인" : "기본 헤더 확인"}</SystemButton><SystemLink variant="quiet" href={route} target="_blank">실제 화면 열기</SystemLink>{exampleValues[example.id] === "true" && <iframe title={"Header " + value} src={route} loading="lazy" />}</div>;
        }
        if (component === "floating-panel") {
            const anchor = value === "drawer" ? drawerAnchor : floatingAnchor;
            return <><SystemButton ref={anchor} variant="secondary" onClick={() => updateExample(example.id, "true")}>{value === "drawer" ? "서랍 열기" : "플로팅 창 열기"}</SystemButton><FloatingPanel open={exampleValues[example.id] === "true"} variant={value as PanelVariant} anchorRef={anchor} onClose={() => updateExample(example.id, "false")} title="가이드 플로팅 창"><p data-text="body">Escape 또는 닫기 버튼으로 닫습니다.</p></FloatingPanel></>;
        }
        return null;
    }

    return (
        <div data-text="body" className="component-catalog" data-documentation-tool="component-catalog">
            <p data-text="body">제품 등록부와 실제 import·렌더 경로를 대조한 목록입니다. 등록된 모든 구현은 제품에 연결되어야 합니다. 별칭은 같은 구현으로 묶고, 가이드의 목록·재질 실험 도구와 퇴역 구현은 제품 수에 포함하지 않습니다.</p>
            <dl className="component-counts" aria-label="컴포넌트 연결 현황">
                <div><dt data-text="label">등록된 구현</dt><dd data-text="body" data-count="total">{COMPONENT_COUNTS.total}</dd></div>
                <div><dt data-text="label">제품 연결</dt><dd data-text="body" data-count="product">{COMPONENT_COUNTS.product}</dd></div>
                <div><dt data-text="label">가이드 전용</dt><dd data-text="body" data-count="guide-only">{COMPONENT_COUNTS.documentationOnly}</dd></div>
                <div><dt data-text="label">미사용</dt><dd data-text="body" data-count="unused">{COMPONENT_COUNTS.unused}</dd></div>
            </dl>

            <DeepSearchDisclosure title="대화로 컴포넌트 찾기"
                onSearch={term => contextSearchReply(term, COMPONENT_REGISTRY.map(entry => ({
                    title: entry.name,
                    description: entry.purpose + " · " + entry.source,
                    href: "#" + entry.guide,
                })), "컴포넌트")}
            />            <SystemField data-text="body" type="search" label="컴포넌트 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="이름, 용도, 소스 파일" />
            <div className="component-table-scroll" role="region" aria-label="전체 컴포넌트 등록부" tabIndex={0}>
                <table className="component-table">
                    <thead><tr><th data-text="label" scope="col">컴포넌트</th><th data-text="label" scope="col">구분·사용</th><th data-text="label" scope="col">규격과 역할</th></tr></thead>
                    <tbody>{entries.map(entry => {
                        const usage = COMPONENT_USAGE[entry.id];
                        return (
                            <tr key={entry.id} data-component-record={entry.id}>
                                <th data-text="label" scope="row"><a data-text="action" href={`#${entry.guide}`}>{entry.name}</a>{entry.lifecycle === "deprecated" && <span data-text="label">Deprecated</span>}<code data-text="meta">{entry.source}</code></th>
                                <td data-text="body">{kinds[entry.kind]}<br /><strong data-text="item-title">{usage ? statuses[usage.status] : "분석 필요"}</strong>{entry.parent && <span data-text="body">상위: {COMPONENT_REGISTRY.find(parent => parent.id === entry.parent)?.name}</span>}</td>
                                <td data-text="body"><p data-text="body">{entry.purpose}</p>{Object.entries(entry.axes || {}).map(([axis, values]) => <p data-text="body" key={axis}>{axis}: {values.join(" · ")}</p>)}{entry.states?.length ? <p data-text="body">상태: {entry.states.join(" · ")}</p> : null}{entry.examples?.length ? <a data-text="action" data-text-size="control" href={`#components/registry/${entry.examples[0].id}`}>실제 예시 {entry.examples.length}개 보기</a> : null}<details><summary data-text="label">실제 연결 경로</summary><ul>{[...new Set([...(usage?.productUses || []), ...(usage?.guideUses || [])])].map(source => <li data-text="body" key={source}><code data-text="meta">{source}</code></li>)}</ul></details></td>
                            </tr>
                        );
                    })}</tbody>
                </table>
            </div>

            <h3 data-text="subheading">속성 축과 상태의 실제 예시</h3>
            <p data-text="body">각 예시는 제품 컴포넌트의 공식 열거값에서 생성됩니다. 선택·입력·펼침은 직접 조작할 수 있습니다.</p>
            <p data-text="body">circle은 이름이 있는 아이콘 조작에 사용합니다. 기본 지름은 48px, flow는 50px입니다. 선택·hover·누름·비활성 상태는 배경과 전경을 함께 결정하며, 비활성이 우선합니다. 중립색 토글은 밝고 어두운 면을 반전하고 브랜드색 토글은 브랜드 채움과 아이콘 상태를 유지합니다.</p>
            <div className="component-contract-examples">{COMPONENT_REGISTRY.filter(entry => entry.examples?.length).map(entry => <section key={entry.id} aria-label={entry.name} className="component-contract-group">
                <h4 data-text="item-title">{entry.name}</h4>
                {entry.examples!.map(example => <div data-text="body" key={example.id} id={example.id} data-component-example={entry.id} data-example-axis={example.axis} data-example-value={example.value} data-example-state={example.state} className={"component-contract-example" + (example.value?.startsWith("inverse") ? " is-inverse" : "")}>
                    <p data-text="caption">{example.axis || "state"}: {example.value || example.state}</p>
                    {renderExample(entry.id, example)}
                </div>)}
            </section>)}</div>

            <h3 data-text="subheading">같은 컨트롤, 서로 다른 역할</h3>
            <div className="component-actions">
                <SystemLink data-text="action" href="/programs">프로그램으로 이동 <Icon name="arrow" size={20} /></SystemLink>
                <SystemIconButton data-text="action" aria-label="공통 아이콘 버튼 확인" onClick={() => showSmallNotification("공통 아이콘 버튼으로 실행했어요.")}><Icon name="plus" /></SystemIconButton>
            </div>
            <SystemCheckbox data-text="label" checked={consent} onChange={event => setConsent(event.target.checked)} label="실제 화면과 같은 체크박스입니다" />

            <h3 data-text="subheading">대표 콘텐츠와 시즌 배너</h3>
            <div className="home-v4-wrap component-hero-preview"><HeroSlide idPrefix="guide-feature" feature={HOME_FEATURES[0]} active layout="standalone" /></div>
            <SeasonBanner id="design-season-banner" />

            <h3 data-text="subheading">티켓오픈과 유리 시계</h3>
            <div className="component-companion-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="component-preview-background" src={mediaPath(`assets/images/${HOME_FEATURES[0].image}`)} alt="" width={1672} height={941} loading="lazy" />
                <HeroCompanion />
            </div>

            <h3 data-text="subheading">공간 관계를 유지하는 선택 조작</h3>
            <div className="component-booking-preview">
                <BookingCalendar month={month} selectedDate={date} today="2026-10-21" programs={PROGRAMS} dateLabel={value => value.replaceAll("-", ".")} onMonthChange={setMonth} onDateChange={setDate} />
                <BookingProgramChoice program={PROGRAMS[0]} selected={selected} available past={false} onSelect={() => setSelected(value => !value)} />
            </div>
            <p data-text="body">달력의 날짜에 마우스를 올리거나 키보드 초점을 맞추면 그날의 프로그램을 미리 볼 수 있습니다. 미리보기는 날짜 선택을 바꾸지 않으며 Escape로 닫습니다. 좁은 화면에서는 날짜 입력을 사용합니다.</p>
            <p data-text="caption" className="ds-caption">일반 버튼의 규격을 좌석·달력·복합 선택 타일에 강제로 적용하지 않습니다. 아래 예외는 소유 구현과 이유를 검사하며, 파일 전체를 예외로 두지 않습니다.</p>
            <ul className="component-exceptions">{CONTROL_EXCEPTIONS.map(exception => <li data-text="body" key={`${exception.source}-${exception.part}`}><strong data-text="item-title">{exception.owner} · {exception.part}</strong><span data-text="body">{exception.reason}</span></li>)}</ul>

            {/* [마이페이지의 실제 조합 / Actual account component composition] */}
            <h3 data-text="subheading">개인 공간과 관람 기록</h3>
            <p data-text="body">마이페이지에서 사용하는 동일한 구현입니다. 미리보기에는 예시 데이터를 사용하며, 노트는 페이지를 떠나면 초기화됩니다.</p>
            <div data-text="body" className="component-actions">{([{id:"paper",label:"종이빛"},{id:"sky",label:"하늘빛"},{id:"sun",label:"햇살빛"}] as const).map(theme => <SystemButton data-text="action" variant="secondary" key={theme.id} aria-pressed={roomTheme === theme.id} onClick={() => setRoomTheme(theme.id)}>{theme.label}</SystemButton>)}</div>
            <AccountMiniRoom name="관람객" message="관람의 기록과 좋아하는 것들을 모아요." theme={roomTheme} lightOn={roomLight} programs={PROGRAMS.slice(0, 3)} hasFavorites={false} onToggleLight={() => setRoomLight(value => !value)} />
            <AccountMembershipCard name="관람객" message="나의 취향을 발견하는 중" mode="guest" counts={{upcoming:0,favorites:0,notes:accountNotes.length}} onEdit={() => setPreview("account-experience")} onLogout={() => {}} />
            <AccountTicket variant="compact" program={PROGRAMS[0]} booking={{id:"GUIDE-SAMPLE",programId:PROGRAMS[0].id,title:PROGRAMS[0].title,date:"2026-11-20",time:"19:30",venue:PROGRAMS[0].venue || "세종문화회관",seats:["A1"],total:70000,reference:"GUIDE"}} />
            <AccountDiary programs={PROGRAMS} notes={accountNotes} today="2026-10-21" onSave={draft => { const value = validateAccountNote(draft, new Set(PROGRAMS.map(program => program.id)), "2026-10-21"); if (!value) return false; setAccountNotes(current => [{...value,id:crypto.randomUUID()},...current]); return true; }} onDelete={id => setAccountNotes(current => current.filter(note => note.id !== id))} />

            <h3 data-text="subheading">구조와 전체 페이지 경험</h3>
            <p data-text="body">헤더·푸터·문맥 메뉴·위로 가기·기관 소개는 실제 경로에서 확인합니다. 선택하면 같은 제품 화면을 미리 불러옵니다.</p>
            <div data-text="body" className="component-actions">{COMPONENT_REGISTRY.filter(entry => entry.previewRoute).map(entry => <SystemButton data-text="action" key={entry.id} variant="secondary" aria-pressed={preview === entry.id} onClick={() => setPreview(entry.id)}>{entry.name}</SystemButton>)}</div>
            {previewEntry?.previewRoute && (
                <div className="component-route-preview">
                    <SystemLink data-text="action" variant="quiet" href={previewEntry.previewRoute} target="_blank">{previewEntry.name} 원본 화면 열기 <Icon name="diagonal" size={20} /></SystemLink>
                    <iframe title={`${previewEntry.name} 실제 화면 미리보기`} src={previewEntry.previewRoute} loading="lazy" />
                </div>
            )}
        </div>
    );
}
