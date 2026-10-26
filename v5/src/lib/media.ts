// [중복 경로 없는 로컬 이미지 / One canonical path for local media]
export function mediaPath(source?: string) {
    return "/v5/" + (source || "assets/images/sejong-grand-interior.png").replace(/^\/?(?:v5\/)?/, "");
}
