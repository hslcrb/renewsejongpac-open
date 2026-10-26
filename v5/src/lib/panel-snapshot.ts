let snapshotModule: Promise<typeof import("html-to-image")> | null = null;
let fontCss: Promise<string> | null = null;

// [사용할 때만 불러오는 전환용 텍스처 / Transition textures loaded only when needed]
export function warmPanelSnapshot() {
    return (snapshotModule ||= import("html-to-image"));
}

// [첫 프레임부터 보이는 실제 글자 / Paint the live text immediately, before asynchronous rasterization]
export function capturePanelPreview(panel: HTMLElement) {
    const canvas = document.createElement("canvas");
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.ceil(panel.offsetWidth * ratio);
    canvas.height = Math.ceil(panel.offsetHeight * ratio);
    const context = canvas.getContext("2d")!;
    const bounds = panel.getBoundingClientRect();
    context.scale(ratio, ratio);
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (
            !parent ||
            !node.textContent?.trim() ||
            parent.closest(".sr-only, .liquid-glass-optics, .glass-lens-definitions, svg, script, style")
        ) continue;
        const style = getComputedStyle(parent);
        if (style.visibility === "hidden" || style.display === "none") continue;
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.fillStyle = style.color;
        context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        context.textBaseline = "alphabetic";
        range.selectNodeContents(node);
        const rectangles = range.getClientRects();
        const paint = (text: string, box: DOMRect) => {
            if (!text.trim() || !box.width || !box.height) return;
            const metrics = context.measureText(text);
            const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8;
            const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.2;
            context.fillText(
                text.trim(),
                box.x - bounds.x,
                box.y - bounds.y + (box.height - ascent - descent) / 2 + ascent,
            );
        };
        context.save();
        for (let ancestor = parent; ancestor && ancestor !== panel; ancestor = ancestor.parentElement!) {
            const computed = ancestor === parent ? style : getComputedStyle(ancestor);
            if (computed.overflowX !== "visible" || computed.overflowY !== "visible") {
                const clip = ancestor.getBoundingClientRect();
                context.beginPath();
                context.rect(clip.x - bounds.x, clip.y - bounds.y, clip.width, clip.height);
                context.clip();
            }
        }
        if (rectangles.length === 1) paint(node.textContent, rectangles[0]);
        else {
            let line = "", box: DOMRect | null = null;
            for (let index = 0; index < node.textContent.length; index++) {
                range.setStart(node, index);
                range.setEnd(node, index + 1);
                const current = range.getBoundingClientRect();
                if (box && Math.abs(current.y - box.y) > 1) {
                    paint(line, box);
                    line = "";
                    box = null;
                }
                box ||= current;
                line += node.textContent[index];
            }
            if (box) paint(line, box);
        }
        context.restore();
    }
    return canvas;
}

export async function capturePanelTexture(panel: HTMLElement) {
    const { toCanvas, getFontEmbedCSS } = await warmPanelSnapshot();
    await document.fonts.ready;
    fontCss ||= getFontEmbedCSS(panel, { preferredFontFormat: "woff2" }).catch(() => "");
    return toCanvas(panel, {
        width: panel.offsetWidth,
        height: panel.offsetHeight,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        fontEmbedCSS: await fontCss,
        filter: (node) =>
            !(
                node instanceof Element &&
                (node.classList.contains("liquid-glass-optics") ||
                    node.classList.contains("glass-lens-definitions") ||
                    node.classList.contains("sr-only"))
            ),
        style: {
            position: "relative",
            left: "0",
            top: "0",
            margin: "0",
            transform: "none",
            opacity: "1",
            visibility: "visible",
            boxShadow: "none",
            borderColor: "transparent",
            borderRadius: "0",
            background: "transparent",
            transition: "none",
            animation: "none",
        },
    });
}

// [현재 화면의 색과 이미지를 유리 아래에 유지 / Preserve the visible page beneath the moving glass]
// 블러에 필요한 배경만 그려 DOM 전체의 복제와 매 프레임 캡처를 피합니다.
// Paint only visible backgrounds and images; never clone the page or capture every frame.
export function capturePanelBackdrop(exclude: HTMLElement) {
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1200 / innerWidth);
    canvas.width = Math.ceil(innerWidth * ratio);
    canvas.height = Math.ceil(innerHeight * ratio);
    const context = canvas.getContext("2d")!;
    context.scale(ratio, ratio);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, innerWidth, innerHeight);
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, innerWidth, innerHeight);
    const header = document.querySelector("#header");
    const elements = [...document.body.querySelectorAll<HTMLElement>("*")].filter(
        (element) =>
            element instanceof HTMLElement &&
            !exclude.contains(element) &&
            !element.closest(".floating-panel-webgl"),
    );
    elements.sort(
        (a, b) => Number(Boolean(header?.contains(a))) - Number(Boolean(header?.contains(b))),
    );
    for (const element of elements) {
        const box = element.getBoundingClientRect();
        if (
            box.width < 1 ||
            box.height < 1 ||
            box.right < 0 ||
            box.bottom < 0 ||
            box.x > innerWidth ||
            box.y > innerHeight
        )
            continue;
        const style = getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") continue;
        context.save();
        let opacity = 1;
        for (
            let ancestor: HTMLElement | null = element;
            ancestor && ancestor !== document.body;
            ancestor = ancestor.parentElement
        ) {
            const ancestorStyle = ancestor === element ? style : getComputedStyle(ancestor);
            opacity *= Number(ancestorStyle.opacity);
            if (!opacity) break;
            if (ancestorStyle.overflowX !== "visible" || ancestorStyle.overflowY !== "visible") {
                const bounds = ancestor.getBoundingClientRect();
                const radius = Math.max(
                    0,
                    Math.min(
                        parseFloat(ancestorStyle.borderTopLeftRadius) || 0,
                        bounds.width / 2,
                        bounds.height / 2,
                    ),
                );
                context.beginPath();
                context.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
                context.clip();
            }
        }
        context.globalAlpha = opacity;
        if (
            opacity &&
            style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            style.backgroundColor !== "transparent"
        ) {
            context.fillStyle = style.backgroundColor;
            context.fillRect(box.x, box.y, box.width, box.height);
        }
        if (
            opacity &&
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth &&
            (element.currentSrc.startsWith(location.origin) ||
                element.currentSrc.startsWith("data:"))
        ) {
            if (style.objectFit === "cover") {
                const scale = Math.max(
                    box.width / element.naturalWidth,
                    box.height / element.naturalHeight,
                );
                const width = box.width / scale,
                    height = box.height / scale;
                context.drawImage(
                    element,
                    (element.naturalWidth - width) / 2,
                    (element.naturalHeight - height) / 2,
                    width,
                    height,
                    box.x,
                    box.y,
                    box.width,
                    box.height,
                );
            } else context.drawImage(element, box.x, box.y, box.width, box.height);
        }
        context.restore();
    }
    return canvas;
}
