export type MotionRect = { x: number; y: number; width: number; height: number };
export type PanelSpring = { position: number; velocity: number };

// [중간에 뒤집어도 이어지는 탄성 / A reversible spring that retains its momentum]
export function stepPanelSpring(spring: PanelSpring, target: number, elapsed: number) {
    const steps = Math.max(1, Math.ceil(Math.min(elapsed, 0.04) * 240));
    const dt = Math.min(elapsed, 0.04) / steps;
    for (let i = 0; i < steps; i++) {
        const acceleration = (target - spring.position) * 280 - spring.velocity * 23;
        spring.velocity += acceleration * dt;
        spring.position += spring.velocity * dt;
    }
}

// [버튼 가까운 쪽부터 풀리는 메시 / A mesh that unfurls from the trigger side]
export function samplePanelVertex(
    u: number,
    v: number,
    progress: number,
    velocity: number,
    origin: MotionRect,
    target: MotionRect,
    result = { x: 0, y: 0 },
    presentation: "floating" | "drawer" = "floating",
) {
    const startX = origin.x + u * origin.width;
    const startY = origin.y + v * origin.height;
    const endX = target.x + u * target.width;
    const endY = target.y + v * target.height;
    if (presentation === "drawer") {
        // 왼쪽은 벽 뒤에 유지하고 앞쪽 가장자리만 부드럽게 휩니다.
        // Keep the left edge behind the wall while the leading edge flexes.
        const envelope = Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
        const p = progress - (1 - u) * 0.07 * envelope;
        result.x = progress > 1
            ? target.x + u * target.width * progress
            : startX + (endX - startX) * p;
        result.y = endY + Math.sin(v * Math.PI) * Math.sin(u * Math.PI / 2) *
            envelope * Math.min(8, Math.abs(velocity) * 1.5);
        return result;
    }
    const centerX = origin.x + origin.width / 2;
    const centerY = origin.y + origin.height / 2;
    const diagonal = Math.max(1, Math.hypot(target.width, target.height));
    const distance = Math.min(1, Math.hypot(endX - centerX, endY - centerY) / diagonal);
    const lag = distance * 0.17;
    const p = progress - lag * Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
    const envelope = Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
    const ripple =
        Math.sin(u * Math.PI * 2 + v * Math.PI - progress * Math.PI * 2) *
        envelope *
        Math.min(12, Math.abs(velocity) * 1.8);
    const directionX = target.x + target.width / 2 - centerX;
    const directionY = target.y + target.height / 2 - centerY;
    const length = Math.max(1, Math.hypot(directionX, directionY));
    result.x = startX + (endX - startX) * p - (directionY / length) * ripple;
    result.y = startY + (endY - startY) * p + (directionX / length) * ripple;
    return result;
}
