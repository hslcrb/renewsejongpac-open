// [공통 토큰의 공개 진입점 / Public entry point for shared design tokens]
export {
    DESIGN_COLORS,
    SEMANTIC_COLORS,
    TYPE_SCALE,
    SPACE_SCALE,
    GLASS_MATERIALS,
    DESIGN_TOKEN_VALUES,
    renderDesignTokensCss,
} from "./design-tokens.ts";
import { renderDesignTokensCss } from "./design-tokens.ts";

export const CHAPTERS = [
    {
        id: "overview",
        label: "디자인 시스템 소개",
        group: "시작하기",
        description: "세종의 브랜드를 일관된 화면으로 이어가는 기준",
        sections: [
            ["principles", "설계 원칙"],
            ["structure", "시스템의 구성"],
        ],
    },
    {
        id: "brand",
        label: "브랜드와 로고",
        group: "기초 원칙",
        description: "원형을 보존하는 로고와 디지털 사용 기준",
        sections: [
            ["signature", "기본형"],
            ["clearspace", "보호 공간과 최소 크기"],
            ["usage", "올바른 사용"],
            ["icons", "아이콘"],
        ],
    },
    {
        id: "color",
        label: "컬러",
        group: "기초 원칙",
        description: "기존 팔레트와 역할별 사용법",
        sections: [
            ["palette", "기본 팔레트"],
            ["semantic", "역할별 컬러"],
            ["contrast", "명도 대비"],
        ],
    },
    {
        id: "typography",
        label: "타이포그래피",
        group: "기초 원칙",
        description: "16px에서 시작하는 한글 중심의 읽기 체계",
        sections: [
            ["family", "기본 서체"],
            ["scale", "크기와 위계"],
            ["specimen", "직접 조합하기"],
        ],
    },
    {
        id: "layout",
        label: "레이아웃과 간격",
        group: "기초 원칙",
        description: "4px 단위의 간격과 반응형 구성",
        sections: [
            ["grid", "그리드와 화면"],
            ["spacing", "간격"],
            ["shape", "형태와 경계"],
        ],
    },
    {
        id: "components",
        label: "컴포넌트",
        group: "화면 만들기",
        description: "같은 역할에 같은 형태와 상태를 사용합니다",
        sections: [
            ["registry", "전체 컴포넌트"],
            ["buttons", "버튼"],
            ["cards", "콘텐츠 카드"],
            ["fields", "입력"],
            ["navigation", "탭과 펼침"],
            ["liquid-glass", "리퀴드 글래스"],
            ["floating-menu", "떠 있는 유리 메뉴"],
            ["small-notification", "알림소형모달"],
            ["feedback", "상태와 대화상자"],
        ],
    },
    {
        id: "motion",
        label: "모션",
        group: "화면 만들기",
        description: "읽기와 조작을 돕는 속도, 종료된 모션의 보존 예제",
        sections: [
            ["timing", "시간과 이징"],
            ["scroll", "글자별 스크롤 등장 · Deprecated"],
            ["quick-menu", "보라빛 퀵메뉴"],
        ],
    },
    {
        id: "accessibility",
        label: "접근성과 문장",
        group: "화면 만들기",
        description: "색·크기·입력 방식과 관계없이 전달하는 정보",
        sections: [
            ["reading", "읽기"],
            ["interaction", "조작"],
            ["writing", "문장과 상태 표현"],
        ],
    },
    {
        id: "resources",
        label: "토큰과 자료",
        group: "적용하기",
        description: "실제 코드와 연결된 토큰과 원본 자료",
        sections: [
            ["tokens", "토큰 내보내기"],
            ["assets", "브랜드 자료"],
            ["references", "참고 기준"],
        ],
    },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]["id"];

// [명도 대비 계산 / Relative luminance contrast]
// WCAG의 sRGB 상대 명도 공식으로 실제 팔레트 조합을 계산합니다.
// Calculate palette pairs from the WCAG sRGB relative luminance formula.
export function contrastRatio(first: string, second: string): number {
    const luminance = (hex: string) => {
        if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Expected a six-digit hex color");
        const channels = [1, 3, 5].map((offset) => {
            const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// [기존 문서 내보내기 API / Existing guide export API]
export function designTokensCss(): string {
    return renderDesignTokensCss();
}
