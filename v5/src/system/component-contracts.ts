// [실제 속성과 문서가 함께 사용하는 축 / Axes shared by implementation props and documentation]
export const CONTROL_VARIANTS = ["primary", "secondary", "accent", "highlight", "quiet", "inverse", "inverse-outline", "inverse-quiet"] as const;
export const CONTROL_CONTEXTS = ["default", "flow"] as const;
export const CONTROL_SHAPES = ["rounded", "circle", "pill"] as const;
export const FIELD_ELEMENTS = ["input", "select", "textarea"] as const;
export const BADGE_TONES = ["neutral", "highlight", "info"] as const;
export const APPEARANCES = ["default", "plain"] as const;
export const TAB_ORIENTATIONS = ["horizontal", "vertical"] as const;
export const SURFACE_VARIANTS = ["panel", "subtle", "inset", "banner", "elevated"] as const;
export const SURFACE_PADDINGS = ["none", "sm", "md", "lg"] as const;
export const SURFACE_RADII = ["panel", "compact", "dialog"] as const;
export const HERO_SLIDE_LAYOUTS = ["standalone", "with-companion"] as const;
export const HERO_SLIDE_PREVIEWS = ["previous", "next"] as const;
export const ROOM_THEMES = ["paper", "sky", "sun"] as const;
export const MEMBERSHIP_MODES = ["loading", "guest", "demo", "oauth"] as const;
export const TICKET_VARIANTS = ["compact", "full"] as const;
export const PANEL_PRESENTATIONS = ["floating", "drawer"] as const;
// [헤더 핵심 조작만 확대 / Enlarge only the two primary header actions]
export const ICON_GROUPS = ["general", "header-action"] as const;
export const HEADER_ACTION_ICONS = ["search", "menu"] as const;
export type IconGroup = (typeof ICON_GROUPS)[number];
export type HeaderActionIcon = (typeof HEADER_ACTION_ICONS)[number];
export function isHeaderActionIcon(name: string): name is HeaderActionIcon {
    return (HEADER_ACTION_ICONS as readonly string[]).includes(name);
}
export type ControlVariant = (typeof CONTROL_VARIANTS)[number];
export type ControlContext = (typeof CONTROL_CONTEXTS)[number];
export type ControlShape = (typeof CONTROL_SHAPES)[number];
export type FieldElement = (typeof FIELD_ELEMENTS)[number];
export type BadgeTone = (typeof BADGE_TONES)[number];
export type Appearance = (typeof APPEARANCES)[number];
export type TabOrientation = (typeof TAB_ORIENTATIONS)[number];
export type SurfaceVariant = (typeof SURFACE_VARIANTS)[number];
export type SurfacePadding = (typeof SURFACE_PADDINGS)[number];
export type SurfaceRadius = (typeof SURFACE_RADII)[number];
export type HeroSlideLayout = (typeof HERO_SLIDE_LAYOUTS)[number];
export type HeroSlidePreview = (typeof HERO_SLIDE_PREVIEWS)[number];
export type RoomTheme = (typeof ROOM_THEMES)[number];
export type MembershipMode = (typeof MEMBERSHIP_MODES)[number];
export type TicketVariant = (typeof TICKET_VARIANTS)[number];

export type ComponentAxes = Readonly<Record<string, readonly string[]>>;
export type ComponentExample = Readonly<{ id: string; axis?: string; value?: string; state?: string }>;

// [안정적인 실물 예시 앵커 / Stable anchors for live implementation examples]
export function contractExamples(id: string, axes: ComponentAxes = {}, states: readonly string[] = []): readonly ComponentExample[] {
    return [
        ...Object.entries(axes).flatMap(([axis, values]) => values.map(value => ({ id: `example-${id}-${axis}-${value}`, axis, value }))),
        ...states.map(state => ({ id: `example-${id}-state-${state}`, state })),
    ];
}
