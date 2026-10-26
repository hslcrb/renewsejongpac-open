"use client";

import { useState } from "react";
import LiquidGlass from "../../../components/LiquidGlass";
import { SystemButton } from "../../../components/SystemPrimitives";
import { GLASS_DEFAULTS, GLASS_VARIANTS } from "../../../src/lib/liquid-glass";
import type { GlassVariant } from "../../../src/lib/liquid-glass";

// [같은 컴포넌트의 재질 비교 / Compare material settings on the actual component]
export default function LiquidGlassDemo({
    onCopy,
    copied,
}: {
    onCopy: (code: string) => void;
    copied: boolean;
}) {
    const [variant, setVariant] = useState<GlassVariant>("surface");
    const [opacity, setOpacity] = useState(GLASS_DEFAULTS.opacity);
    const [refraction, setRefraction] = useState(GLASS_DEFAULTS.refraction);
    const material = GLASS_VARIANTS[variant];
    const code = `import LiquidGlass from "@/components/LiquidGlass";\n\n<LiquidGlass variant="${variant}">\n    <h2 data-text="heading">세종문화회관</h2>\n    <p data-text="body">유리 위의 콘텐츠는 선명하게 유지됩니다.</p>\n</LiquidGlass>`;
    // [문서에서만 사용하는 재질 실험 코드 / Material experiment code for documentation only]
    const documentationOnlyCode = `// DOCUMENTATION_ONLY: LiquidGlassDemo 안에서만 사용\n<LiquidGlass variant="${variant}" opacity={${opacity.toFixed(2)}} refraction={${refraction}} blur={${material.blur}} thickness={${material.thickness}}>\n    <p data-text="body">문서 전용 재질 실험</p>\n</LiquidGlass>`;
    return (
        <div data-documentation-tool="glass-demo" data-component-owner="glass">
            <div className="ds-glass-variant">
                <label data-text="label" htmlFor="glass-variant">재질 베리언트</label>
                <select id="glass-variant" value={variant} onChange={event => {
                    const next = event.target.value as GlassVariant;
                    setVariant(next);
                    setOpacity(GLASS_VARIANTS[next].opacity);
                    setRefraction(GLASS_VARIANTS[next].refraction);
                }}>
                    <option data-text="label" value="surface">Surface · 기본 표면</option>
                    <option data-text="label" value="drawer">Drawer · 모바일 서랍</option>
                    <option data-text="label" value="hero">Hero · 히어로 안내</option>
                    <option data-text="label" value="white">White · 밝은 알림</option>
                    <option data-text="label" value="black">Black · 알림 캡슐</option>
                </select>
            </div>
            <div className="ds-glass-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/v5/assets/images/sejong-grand-interior.png"
                    alt=""
                    className="ds-glass-backdrop"
                />
                <LiquidGlass variant={variant} className="ds-glass-example" opacity={opacity} refraction={refraction}>
                    <code data-text="caption" className="ds-glass-component-name">LiquidGlass</code>
                    <h3 data-text="heading">빛을 머금은 유리</h3>
                    <p data-text="body">배경은 가장자리에서 꺾이고, 글자는 선명하게 남습니다.</p>
                </LiquidGlass>
            </div>
            <div className="ds-glass-controls">
                <div>
                    <label data-text="label" htmlFor="glass-opacity">
                        불투명도{" "}
                        <output data-text="meta" htmlFor="glass-opacity">{Math.round(opacity * 100)}%</output>
                    </label>
                    <input
                        id="glass-opacity"
                        type="range"
                        min="0.4"
                        max="0.96"
                        step="0.01"
                        value={opacity}
                        aria-valuetext={`${Math.round(opacity * 100)}%`}
                        onChange={(event) => setOpacity(Number(event.target.value))}
                    />
                </div>
                <div>
                    <label data-text="label" htmlFor="glass-refraction">
                        굴절 강도 <output data-text="meta" htmlFor="glass-refraction">{refraction}</output>
                    </label>
                    <input
                        id="glass-refraction"
                        type="range"
                        min="0"
                        max="120"
                        step="1"
                        value={refraction}
                        onChange={(event) => setRefraction(Number(event.target.value))}
                    />
                </div>
            </div>
            <div className="ds-demo-actions">
                <SystemButton
                    variant="quiet"
                    onClick={() => {
                        setOpacity(material.opacity);
                        setRefraction(material.refraction);
                    }}
                >
                    기본값으로
                </SystemButton>
                <SystemButton variant="secondary" onClick={() => onCopy(code)}>
                    {copied ? "복사됨" : "제품 코드 복사"}
                </SystemButton>
            </div>
            <pre className="ds-code-block">
                <code data-text="body">{code}</code>
            </pre>
            <p data-text="caption">제품에서는 variant로 재질을 선택합니다. 아래 조절값 코드는 가이드 안의 재질 실험 전용입니다.</p>
            <details>
                <summary data-text="label">문서 전용 실험 코드</summary>
                <pre className="ds-code-block"><code data-text="body">{documentationOnlyCode}</code></pre>
                <SystemButton variant="secondary" onClick={() => onCopy(documentationOnlyCode)}>문서 전용 코드 복사</SystemButton>
            </details>
        </div>
    );
}
