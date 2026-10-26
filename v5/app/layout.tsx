import React from "react";
import { CatalogProvider } from "../src/catalog/CatalogProvider";
import { DESIGN_COLORS } from "../src/data/design-tokens";
import SiteShell from "../components/SiteShell";
import GlobalScrollbar from "../components/GlobalScrollbar";
import HomeEntryIntro from "../components/HomeEntryIntro";

import "../styles/compat/shared.css";
import "../styles/compat/programs.css";
import "../styles/compat/pages.css";
import "../styles/compat/flows.css";
import "../styles/tokens.css";
import "../styles/defaults.css";
import "../styles/base.css";
import "../styles/components.css";
import "../styles/home.css";
import "../styles/programs.css";
import "../styles/information.css";
import "../styles/transactions.css";
import "../styles/cards.css";
import "../styles/notices.css";
import "../public/assets/icons/material-symbols.css";
import "../public/assets/ui-feedback.css";
import "../styles/refinements.css";
import "../styles/experiences.css";
import "../styles/goods.css";
import "../styles/motion.css";
import "../styles/experience.css";
import "../styles/home-v4.css";
import "../styles/story.css";
import "../styles/journeys.css";
import "../styles/liquid-glass.css";
import "../styles/floating-menu.css";
import "../styles/design-system.css";
import "../styles/small-notification-modal.css";
import "../styles/hero-companion.css";
import "../styles/system-primitives.css";
import "../styles/system-control-group.css";
import "../styles/component-catalog.css";
import "../styles/account-mini-room.css";
import "../styles/account-space.css";
import "../styles/page-layout.css";
import "../styles/system-surface.css";
import "../styles/typography.css";
import "../styles/icons.css";
import "../styles/ai-chat.css";
import "../styles/deep-search.css";

export const metadata = {
    title: "세종문화회관 | 공연·전시·교육",
    description: "공연·전시·교육 일정과 예매, 이용 안내를 한곳에서 확인하세요.",
};

export const viewport = { themeColor: DESIGN_COLORS.find(color => color.token === "color-white")!.hex };

// 공개된 데이터 원본에만 조기 연결한다. 브라우저가 TCP/TLS 완료를 보장하는 것은 아니다.
function catalogPreconnectOrigin(): string | null {
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredUrl) return null;
    try {
        const url = new URL(configuredUrl);
        return url.protocol === "https:" && url.hostname !== "your-project-id.supabase.co"
            ? url.origin : null;
    } catch {
        return null;
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dataOrigin = catalogPreconnectOrigin();
    return (
        <html lang="ko">
            <head>
                <GlobalScrollbar />
                {dataOrigin && <link rel="preconnect" href={dataOrigin} crossOrigin="anonymous" />}
                {dataOrigin && <link rel="dns-prefetch" href={dataOrigin} />}
                <link rel="icon" type="image/svg+xml" href="/v5/assets/favicon.svg" />
                <link rel="preload" href="/v5/assets/fonts/woff2/WantedSansVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            </head>
            <body>
                <CatalogProvider><HomeEntryIntro /><SiteShell>{children}</SiteShell></CatalogProvider>
            </body>
        </html>
    );
}
