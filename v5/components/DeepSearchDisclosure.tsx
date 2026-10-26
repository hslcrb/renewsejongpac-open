"use client";

import { useState } from "react";
import DeepSearch from "./DeepSearch";

/** Progressive enhancement: native filter stays visible and usable at every width. */
export default function DeepSearchDisclosure({
    title = "대화형 검색으로 더 찾아보기",
    onSearch,
}: {
    title?: string;
    onSearch?: (query: string) => string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <details data-component-id="deep-search-disclosure" className="sejong-deep-search-disclosure" onToggle={event => setOpen(event.currentTarget.open)}>
            <summary data-text="action">
                {title}
                <span data-text="meta">Deep Chat</span>
            </summary>
            {open && <DeepSearch compact onSearch={onSearch} />}
        </details>
    );
}
