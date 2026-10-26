/**
 * [전체 화면의 공통 스크롤바 / Site-wide native scrollbar skin]
 *
 * Applied once in the root document head, including nested scroll containers,
 * dialogs and the independent design-system documentation route.
 *
 * We keep native browser scrolling, keyboard navigation and touch behavior.
 * No overlay, custom event listener or extra scroll container is introduced.
 */
export const GLOBAL_SCROLLBAR_STYLES = `
:where(html, body, *) {
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-300) transparent;
}

:where(html, body, *)::-webkit-scrollbar {
    width: 7px;
    height: 7px;
    background: none;
}

:where(html, body, *)::-webkit-scrollbar-track,
:where(html, body, *)::-webkit-scrollbar-track-piece,
:where(html, body, *)::-webkit-scrollbar-corner {
    background: none;
    box-shadow: none;
}

:where(html, body, *)::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-300);
    border: 1px solid transparent;
    background-clip: padding-box;
    border-radius: 999px;
}

:where(html, body, *)::-webkit-scrollbar-thumb:hover,
:where(html, body, *)::-webkit-scrollbar-thumb:active {
    background-color: var(--color-gray-600);
}

/* Respect system contrast settings instead of hiding an essential control. */
@media (forced-colors: active) {
    :where(html, body, *) {
        scrollbar-color: auto;
    }
}
`;

export default function GlobalScrollbar() {
    return <style data-component-id="global-scrollbar">{GLOBAL_SCROLLBAR_STYLES}</style>;
}
