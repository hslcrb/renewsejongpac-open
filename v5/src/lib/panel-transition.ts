import { samplePanelVertex, stepPanelSpring } from "./panel-motion";
import type { MotionRect } from "./panel-motion";
import { capturePanelBackdrop, capturePanelPreview, capturePanelTexture } from "./panel-snapshot";

export type PanelPhase = "opening" | "open" | "closing";
type TransitionOptions = {
    panel: HTMLDivElement;
    canvas: HTMLCanvasElement;
    anchor: () => HTMLElement | null;
    onPhase: (phase: PanelPhase) => void;
    onClosed: () => void;
};
export type PanelTransition = { setOpen: (open: boolean) => void; dispose: () => void };

const vertexSource = `
precision highp float;
attribute vec2 a_position;
attribute vec2 a_uv;
uniform vec2 u_viewport;
varying vec2 v_uv;
varying vec2 v_screen;
void main() {
    gl_Position = vec4(a_position.x / u_viewport.x * 2.0 - 1.0,
        1.0 - a_position.y / u_viewport.y * 2.0, 0.0, 1.0);
    v_uv = a_uv;
    v_screen = a_position / u_viewport;
}`;
const fragmentSource = `
precision highp float;
varying vec2 v_uv;
varying vec2 v_screen;
uniform sampler2D u_content;
uniform sampler2D u_backdrop;
uniform vec2 u_viewport;
uniform vec2 u_size;
uniform float u_radius;
uniform float u_fade;
uniform float u_opacity;
uniform float u_texture;
uniform float u_refraction;
uniform float u_blur;
uniform float u_thickness;
uniform float u_drawer;
void main() {
    float radius = u_drawer > 0.5 && v_uv.x < 0.5 ? 0.0 : u_radius;
    vec2 q = abs((v_uv - 0.5) * u_size) - (u_size * 0.5 - radius);
    float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    float mask = 1.0 - smoothstep(-0.8, 0.8, distance);
    float rim = 1.0 - smoothstep(0.0, u_thickness * 0.5, max(0.0, -distance));
    float highlight = 0.5 + 0.5 * sin(v_uv.x * 3.8 + v_uv.y * 2.4);
    vec2 normal = normalize((v_uv - 0.5) * u_size + vec2(0.0001));
    vec2 uv = v_screen - normal * rim * u_refraction * 0.3125 / u_viewport;
    vec2 blur = vec2(u_blur * 0.78) / u_viewport;
    vec3 backdrop = texture2D(u_backdrop, uv).rgb * 0.2;
    backdrop += texture2D(u_backdrop, uv + vec2(blur.x, 0.0)).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv - vec2(blur.x, 0.0)).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv + vec2(0.0, blur.y)).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv - vec2(0.0, blur.y)).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv + blur).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv - blur).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv + vec2(blur.x, -blur.y)).rgb * 0.1;
    backdrop += texture2D(u_backdrop, uv + vec2(-blur.x, blur.y)).rgb * 0.1;
    vec3 glass = mix(backdrop, vec3(0.97 + 0.03 * highlight), min(0.97, u_opacity + rim * 0.13));
    float glassAlpha = 1.0;
    vec4 ink = texture2D(u_content, clamp(v_uv, 0.0, 1.0));
    ink.a *= u_texture;
    float alpha = ink.a + glassAlpha * (1.0 - ink.a);
    vec3 rgb = ink.rgb * ink.a + glass * glassAlpha * (1.0 - ink.a);
    float shadow = exp(-max(distance, 0.0) / 10.0) * (1.0 - mask) * 0.15;
    gl_FragColor = vec4(rgb * mask, alpha * mask + shadow) * u_fade;
}`;

function rect(element: HTMLElement): MotionRect {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
}
function originFor(options: TransitionOptions): MotionRect {
    if (options.panel.dataset.presentation === "drawer") {
        const target = rect(options.panel);
        return { ...target, x: target.x - target.width };
    }
    const anchor = options.anchor();
    return anchor && anchor.offsetWidth
        ? rect(anchor)
        : { x: innerWidth - 72, y: 28, width: 48, height: 48 };
}
function phase(options: TransitionOptions, value: PanelPhase) {
    options.panel.dataset.phase = value;
    options.canvas.dataset.phase = value;
    options.panel.inert = value !== "open";
    options.onPhase(value);
}

// [모션 감소와 GPU 미지원의 같은 수명 주기 / Equivalent lifecycle without GPU motion]
function nativeTransition(options: TransitionOptions, reduced: boolean): PanelTransition {
    const { panel, canvas } = options;
    canvas.dataset.renderer = reduced ? "reduced-motion" : "dom";
    canvas.style.visibility = "hidden";
    let animation: Animation | null = null;
    let target = false;
    let settled = false;
    let disposed = false;
    const duration = reduced ? 120 : 460;
    return {
        setOpen(open) {
            if (disposed) return;
            target = open;
            phase(options, open ? "opening" : "closing");
            if (!animation || settled) {
                const destination = rect(panel);
                const origin = originFor(options);
                canvas.dataset.origin = JSON.stringify(origin);
                canvas.dataset.destination = JSON.stringify(destination);
                const end = `translate3d(${destination.x}px, ${destination.y}px, 0)`;
                const start = reduced
                    ? end
                    : `translate3d(${origin.x}px, ${origin.y}px, 0) scale(${origin.width / destination.width}, ${origin.height / destination.height})`;
                panel.style.transformOrigin = "0 0";
                const radius = panel.dataset.presentation === "drawer" ? "0 24px 24px 0" : "24px";
                animation = panel.animate(
                    [
                        { transform: start, opacity: 0, borderRadius: radius },
                        { transform: end, opacity: 1, borderRadius: radius },
                    ],
                    { duration, easing: "cubic-bezier(.2,.88,.2,1)", fill: "both" },
                );
                animation.pause();
                animation.currentTime = open ? 0 : duration;
                animation.onfinish = () => {
                    if (disposed) return;
                    settled = true;
                    if (target) {
                        phase(options, "open");
                        animation?.cancel();
                    } else options.onClosed();
                };
            }
            settled = false;
            animation.playbackRate = open ? 1 : -1;
            animation.play();
        },
        dispose() {
            disposed = true;
            animation?.cancel();
            panel.style.transformOrigin = "";
        },
    };
}

// [실제 텍스처를 휘는 WebGL 메시 / WebGL mesh deformation of the actual panel texture]
export function createPanelTransition(options: TransitionOptions): PanelTransition {
    const { panel, canvas } = options;
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return nativeTransition(options, true);
    const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
    });
    if (!gl) return nativeTransition(options, false);
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw new Error("Panel shader compilation failed");
        }
        shaders.push(shader);
        return shader;
    };
    const program = gl.createProgram()!;
    try {
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error("Panel shader link failed");
    } catch (error) {
        canvas.dataset.shaderError = String(error);
        shaders.forEach((shader) => gl.deleteShader(shader));
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return nativeTransition(options, false);
    }
    const columns = 32,
        rows = 22;
    const vertexCount = (columns + 1) * (rows + 1);
    const vertices = new Float32Array(vertexCount * 4);
    const indices = new Uint16Array(columns * rows * 6);
    let index = 0;
    for (let y = 0; y <= rows; y++)
        for (let x = 0; x <= columns; x++) {
            const offset = (y * (columns + 1) + x) * 4;
            vertices[offset + 2] = (x / columns) * 1.1 - 0.05;
            vertices[offset + 3] = (y / rows) * 1.1 - 0.05;
            if (x < columns && y < rows) {
                const a = y * (columns + 1) + x,
                    b = a + columns + 1;
                indices.set([a, a + 1, b, a + 1, b + 1, b], index);
                index += 6;
            }
        }
    const vertexBuffer = gl.createBuffer()!;
    const indexBuffer = gl.createBuffer()!;
    const texture = gl.createTexture()!;
    const backdropTexture = gl.createTexture()!;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength, gl.DYNAMIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const uvLocation = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255]),
    );
    gl.activeTexture(gl.TEXTURE0);
    const uniforms = Object.fromEntries(
        ["viewport", "size", "radius", "fade", "opacity", "texture", "content", "backdrop", "refraction", "blur", "thickness", "drawer"].map(
            (name) => [name, gl.getUniformLocation(program, "u_" + name)],
        ),
    );
    gl.uniform1i(uniforms.content, 0);
    gl.uniform1i(uniforms.backdrop, 1);
    canvas.dataset.renderer = "webgl";
    canvas.dataset.texture = "pending";
    let disposed = false,
        target = 0,
        frame = 0,
        lastTime = 0,
        started = 0;
    let textureReadyAt = 0,
        capturePending = false,
        capturedContent = "",
        captureTimer = 0;
    let destination = rect(panel),
        origin = originFor(options);
    let materialOpacity = 0.82,
        materialRadius = 24,
        materialRefraction = 64,
        materialBlur = 18,
        materialThickness = 32;
    const presentation = panel.dataset.presentation === "drawer" ? "drawer" : "floating";
    let fallback: PanelTransition | null = null;
    const spring = { position: 0, velocity: 0 };
    const point = { x: 0, y: 0 };
    const resize = () => {
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(innerWidth * ratio);
        canvas.height = Math.round(innerHeight * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        destination = rect(panel);
        origin = originFor(options);
    };
    const contentKey = () => {
        const scrolling = [...panel.querySelectorAll<HTMLElement>("*")]
            .map((element, index) => element.scrollTop || element.scrollLeft
                ? `${index}:${element.scrollTop},${element.scrollLeft}` : "")
            .filter(Boolean).join(";");
        const disclosures = [...panel.querySelectorAll("details")].map(element => Number(element.open)).join("");
        return `${panel.offsetWidth}x${panel.offsetHeight}|${scrolling}|${disclosures}|${panel.textContent}`;
    };
    const capture = async () => {
        const content = contentKey();
        if (disposed || capturePending || capturedContent === content) return;
        capturePending = true;
        try {
            const bitmap = await capturePanelTexture(panel);
            if (disposed) return;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
            textureReadyAt ||= performance.now();
            capturedContent = content;
            canvas.dataset.texture = "ready";
        } catch (error) {
            if (!disposed) {
                canvas.dataset.texture = "unavailable";
                canvas.dataset.snapshotError = String(error).slice(0, 160);
            }
        } finally {
            capturePending = false;
        }
    };
    const scheduleCapture = () => {
        clearTimeout(captureTimer);
        // 모션 중 DOM 복제와 폰트 삽입을 피합니다. / Keep rasterization out of the animation's frame budget.
        captureTimer = window.setTimeout(() => {
            captureTimer = 0;
            if (!disposed && !frame && target) void capture();
        }, 80);
    };
    const rest = () => {
        spring.position = target;
        spring.velocity = 0;
        frame = 0;
        canvas.style.visibility = "hidden";
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (target) {
            phase(options, "open");
            scheduleCapture();
        }
        else options.onClosed();
    };
    const draw = (now: number) => {
        if (disposed || fallback) return;
        // 긴 layout effect 안에서 예약한 RAF의 과거 시각을 보정합니다. / RAF can carry an earlier timestamp.
        const elapsed = Math.max(0, Math.min((now - lastTime) / 1000, 0.04));
        lastTime = now;
        stepPanelSpring(spring, target, elapsed);
        if (
            (Math.abs(spring.position - target) < 0.0008 && Math.abs(spring.velocity) < 0.014) ||
            now - started > 1600
        ) {
            rest();
            return;
        }
        const p = spring.position;
        for (let offset = 0; offset < vertices.length; offset += 4) {
            samplePanelVertex(
                vertices[offset + 2],
                vertices[offset + 3],
                p,
                spring.velocity,
                origin,
                destination,
                point,
                presentation,
            );
            vertices[offset] = point.x;
            vertices[offset + 1] = point.y;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
        gl.useProgram(program);
        gl.uniform2f(uniforms.viewport, innerWidth, innerHeight);
        const sizeProgress = Math.max(0, Math.min(1, p));
        const width = origin.width + (destination.width - origin.width) * sizeProgress;
        const height = origin.height + (destination.height - origin.height) * sizeProgress;
        gl.uniform2f(uniforms.size, width, height);
        gl.uniform1f(uniforms.radius, Math.min(materialRadius, width / 2, height / 2));
        gl.uniform1f(uniforms.fade, Math.max(0, Math.min(1, p / 0.14)));
        gl.uniform1f(uniforms.opacity, materialOpacity);
        gl.uniform1f(uniforms.refraction, materialRefraction);
        gl.uniform1f(uniforms.blur, materialBlur);
        gl.uniform1f(uniforms.thickness, materialThickness);
        gl.uniform1f(uniforms.drawer, Number(presentation === "drawer"));
        gl.uniform1f(
            uniforms.texture,
            textureReadyAt ? Math.min(1, (now - textureReadyAt) / 90) : 0,
        );
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        canvas.dataset.progress = p.toFixed(4);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        frame = requestAnimationFrame(draw);
    };
    const onHidden = () => {
        if (document.hidden && frame) {
            cancelAnimationFrame(frame);
            rest();
        }
    };
    const onPreference = () => {
        if (motionPreference.matches && frame) {
            cancelAnimationFrame(frame);
            rest();
        }
    };
    const onContextLost = (event: Event) => {
        event.preventDefault();
        cancelAnimationFrame(frame);
        frame = 0;
        fallback = nativeTransition(options, false);
        fallback.setOpen(Boolean(target));
    };
    const observer = new ResizeObserver(() => {
        if (!frame) {
            destination = rect(panel);
            if (target) scheduleCapture();
        }
    });
    observer.observe(panel);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onHidden);
    motionPreference.addEventListener("change", onPreference);
    canvas.addEventListener("webglcontextlost", onContextLost);
    resize();
    return {
        setOpen(open) {
            if (disposed) return;
            if (!fallback && motionPreference.matches) {
                cancelAnimationFrame(frame);
                frame = 0;
                fallback = nativeTransition(options, true);
            }
            if (fallback) {
                fallback.setOpen(open);
                return;
            }
            if (frame && target === Number(open)) return;
            clearTimeout(captureTimer);
            target = Number(open);
            destination = rect(panel);
            origin = originFor(options);
            const style = getComputedStyle(panel);
            materialOpacity = parseFloat(style.getPropertyValue("--glass-opacity")) || 0.82;
            materialRadius = parseFloat(style.borderTopLeftRadius) || 24;
            materialRefraction = parseFloat(style.getPropertyValue("--glass-refraction")) || 64;
            materialBlur = parseFloat(style.getPropertyValue("--glass-blur")) || 18;
            materialThickness = parseFloat(style.getPropertyValue("--glass-thickness")) || 32;
            canvas.dataset.origin = JSON.stringify(origin);
            canvas.dataset.destination = JSON.stringify(destination);
            phase(options, open ? "opening" : "closing");
            const backdrop = capturePanelBackdrop(panel);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backdrop);
            gl.activeTexture(gl.TEXTURE0);
            if (!textureReadyAt || (!open && capturedContent !== contentKey())) {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, capturePanelPreview(panel));
                textureReadyAt = performance.now() - 90;
                canvas.dataset.texture = "preview";
            }
            canvas.style.visibility = "visible";
            started = performance.now();
            if (!frame) {
                lastTime = started;
                frame = requestAnimationFrame(draw);
            }
        },
        dispose() {
            disposed = true;
            clearTimeout(captureTimer);
            cancelAnimationFrame(frame);
            observer.disconnect();
            fallback?.dispose();
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onHidden);
            motionPreference.removeEventListener("change", onPreference);
            canvas.removeEventListener("webglcontextlost", onContextLost);
            gl.deleteTexture(texture);
            gl.deleteTexture(backdropTexture);
            gl.deleteBuffer(vertexBuffer);
            gl.deleteBuffer(indexBuffer);
            shaders.forEach((shader) => gl.deleteShader(shader));
            gl.deleteProgram(program);
            gl.getExtension("WEBGL_lose_context")?.loseContext();
        },
    };
}
