import { esc } from "../lib/core.ts";

// [필요한 안내만 남기기 / Keep useful notice content]
// 고지는 장식용 띠 박스 대신 읽기 쉬운 본문으로 제공합니다.
// Present required information as readable text instead of a decorative stripe box.
export function informationNotice(text, title = "이용 전 확인해 주세요") {
    return `<aside class="info-note" role="note"><strong>${esc(title)}</strong><p>${esc(text)}</p></aside>`;
}
