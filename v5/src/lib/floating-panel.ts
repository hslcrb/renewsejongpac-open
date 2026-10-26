export type PanelPoint = { x: number; y: number };
export type PanelVariant = "floating" | "drawer";
export const PANEL_DRAWER_QUERY = "(max-width: 700px)";
export type PanelFrame = {
    width: number;
    height: number;
    panelWidth: number;
    panelHeight: number;
    inset: number;
};

// [화면 안의 자유로운 배치 / Free positioning within the viewport]
export function constrainPanel(point: PanelPoint, frame: PanelFrame): PanelPoint {
    return {
        x: Math.max(frame.inset, Math.min(point.x, frame.width - frame.panelWidth - frame.inset)),
        y: Math.max(frame.inset, Math.min(point.y, frame.height - frame.panelHeight - frame.inset)),
    };
}

export function initialPanelPosition(frame: PanelFrame): PanelPoint {
    return constrainPanel({ x: (frame.width - frame.panelWidth) / 2, y: 108 }, frame);
}

// [기존 굴절 함수의 호환 내보내기 / Compatibility export for the extracted optical helper]
export { glassDisplacement } from "./liquid-glass.ts";
