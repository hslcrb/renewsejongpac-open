"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { SmallNotificationModalHost } from "./SmallNotificationModal";
import ReturnTop from "./ReturnTop";
import ContextMenu from "./ContextMenu";
import AiChatWidget from "./AiChatWidget";

// [사이트와 문서의 탐색 영역 / Product and documentation navigation]
// 디자인 가이드는 자체 문서 탐색을 사용하고, 나머지 화면은 기존 사이트 셸을 유지합니다.
// The design guide owns its documentation navigation; other pages retain the product shell.
export default function SiteShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const documentation = pathname.replace(/\/$/, "").endsWith("/design-rules");
    if (documentation) {
        return (
            <>
                <a data-text="action" data-text-size="control" data-component-owner="site-shell" data-component-part="skip-link" className="skip-link" href="#main">
                    본문 바로가기
                </a>
                {children}
                <SmallNotificationModalHost />
            </>
        );
    }
    return (
        <>
            <a data-text="action" data-text-size="control" data-component-owner="site-shell" data-component-part="skip-link" className="skip-link" href="#main">
                본문 바로가기
            </a>
            <Header />
            <main data-component-id="site-shell" data-text="body" id="main" tabIndex={-1}>
                {children}
            </main>
            <Footer />
            <ReturnTop />
            <AiChatWidget />
            <ContextMenu />
            <SmallNotificationModalHost />
        </>
    );
}
