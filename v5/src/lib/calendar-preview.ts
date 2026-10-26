export type PreviewPoint = Readonly<{ x: number; y: number }>;
export type PreviewSize = Readonly<{ width: number; height: number }>;

// [커서 간격과 화면 가장자리 충돌 / Cursor gap and viewport collision]
// 표면 크기는 CSS가 제한하고, 위치는 넘칠 때 반대편 또는 가장자리로 조정합니다.
// CSS constrains the surface size; flip or clamp its position at viewport edges.
export function positionCalendarPreview(anchor: PreviewPoint, size: PreviewSize, viewport: PreviewSize): PreviewPoint {
    const gap = 18;
    const margin = 12;
    let x = anchor.x + gap;
    let y = anchor.y + gap;
    if (x + size.width > viewport.width - margin) x = anchor.x - size.width - gap;
    if (y + size.height > viewport.height - margin) {
        const above = anchor.y - size.height - gap;
        y = above >= margin ? above : viewport.height - size.height - margin;
    }
    return {
        x: Math.max(margin, Math.min(x, viewport.width - size.width - margin)),
        y: Math.max(margin, Math.min(y, viewport.height - size.height - margin)),
    };
}
