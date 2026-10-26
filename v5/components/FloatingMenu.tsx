"use client";

import { useSyncExternalStore } from "react";
import type { RefObject } from "react";
import Icon from "./Icon";
import FloatingPanel from "./FloatingPanel";
import { SystemDisclosure } from "./SystemNavigation";
import { NAV } from "../src/data/catalog";
import type { PanelPoint } from "../src/lib/floating-panel";
import { PANEL_DRAWER_QUERY } from "../src/lib/floating-panel";

const subscribeViewport = (listener: () => void) => {
    const query = matchMedia(PANEL_DRAWER_QUERY);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
};
const isDrawer = () => matchMedia(PANEL_DRAWER_QUERY).matches;
const serverPresentation = () => false;

// [흰 덮개 없는 떠 있는 탐색 / Floating navigation without a page-covering backdrop]
// 정적 범주·상세 문서는 각 문서 주소로 엽니다. / Document links preserve exported category and detail routes.
export default function FloatingMenu({
    open,
    onClose,
    returnFocus,
    position,
}: {
    open: boolean;
    onClose: () => void;
    returnFocus: RefObject<HTMLButtonElement>;
    position: { current: PanelPoint | null };
}) {
    const drawer = useSyncExternalStore(subscribeViewport, isDrawer, serverPresentation);
    return (
        <FloatingPanel
            open={open}
            variant={drawer ? "drawer" : "floating"}
            onClose={onClose}
            anchorRef={returnFocus}
            position={position}
            id="menu-dialog"
            className="glass-menu"
            title="전체 메뉴"
            eyebrow="세종문화회관"
            closeLabel="전체 메뉴 닫기"
            moveLabel="메뉴 위치 이동"
        >
            <div className="glass-menu-content" data-component-id="floating-menu" data-component-owner="floating-panel">
                <div className="glass-menu-journeys">
                    <a data-text="action" href="/v5/visit/plan/">
                        <span data-text="body">관람할 날부터 이동 안내까지</span>
                        <strong data-text="item-title">
                            방문 계획 <Icon name="arrow" size={28} />
                        </strong>
                    </a>
                    <a data-text="action" href="/v5/rental/compare/">
                        <span data-text="body">공간 조건을 한눈에 비교</span>
                        <strong data-text="item-title">
                            대관 공간 비교 <Icon name="arrow" size={28} />
                        </strong>
                    </a>
                </div>
                <nav data-text="body" className="glass-menu-columns" aria-label="전체 메뉴">
                    {NAV.map((group) => drawer ? (
                        <SystemDisclosure
                            appearance="plain"
                            className="glass-menu-group"
                            key={group.id}
                            summary={<>{group.title} <Icon name="chevron" size={24} /></>}
                        >
                            <div data-text="body" className="glass-menu-group-links">
                                <a data-text="action" className="glass-menu-overview" href={`/v5${group.path}/`}>{group.title} 전체</a>
                                {group.items.map(([label, path]) => (
                                    <a data-text="action" key={path} href={`/v5${path}/`}>{label}</a>
                                ))}
                            </div>
                        </SystemDisclosure>
                    ) : (
                        <div data-text="body" key={group.id}>
                            <a data-text="action" className="glass-menu-title" href={`/v5${group.path}/`}>
                                {group.title}
                            </a>
                            {group.items.map(([label, path]) => (
                                <a data-text="action" key={path} href={`/v5${path}/`}>
                                    {label}
                                </a>
                            ))}
                        </div>
                    ))}
                </nav>
                <nav className="glass-menu-utilities" aria-label="개인 서비스">
                    <a data-text="action" href="/v5/account/">마이페이지</a>
                    <a data-text="action" href="/v5/account/">예매내역</a>
                    <a data-text="action" href="/v5/account/">관심 프로그램</a>
                    <a data-text="action" href="/v5/sitemap/">사이트맵</a>
                    <a data-text="action" href="/v5/english/" lang="en">
                        English guide
                    </a>
                </nav>
            </div>
        </FloatingPanel>
    );
}
