import type { Program } from "../../types/sejong.ts";

const memory = new Map<string, any>();

export const esc = (value: any): string =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
                c
            ] || c
    );

export const href = (path: string): string => "#" + (path.startsWith("/") ? path : "/" + path);

export function getRoute(): { path: string; query: URLSearchParams } {
    let raw = "/";
    if (typeof location !== "undefined") {
        if (location.hash && location.hash.startsWith("#/")) {
            raw = location.hash.slice(1);
        } else if (location.pathname) {
            let p = location.pathname.replace(/^\/v5/, "").replace(/\/index\.html$/, "");
            if (p && p !== "/") {
                raw = p + (location.search || "");
            }
        }
    }
    const i = raw.indexOf("?");
    return {
        path: decodeURI(i < 0 ? raw : raw.slice(0, i)).replace(/\/$/, "") || "/",
        query: new URLSearchParams(i < 0 ? "" : raw.slice(i + 1)),
    };
}

export function filterPrograms(
    items: Program[],
    { category = "전체", date = "", search = "", genre = "", venue = "" }: {
        category?: string;
        date?: string;
        search?: string;
        genre?: string;
        venue?: string;
    } = {}
): Program[] {
    const q = search.trim().toLocaleLowerCase();
    return items.filter(
        (p) =>
            (!category || category === "전체" || p.category === category) &&
            (!date || ((p.start || "") <= date && (p.end || "") >= date)) &&
            (!genre || p.genre === genre) &&
            (!venue || p.venue === venue) &&
            (!q ||
                [p.title, p.genre, p.venue, p.description]
                    .join(" ")
                    .toLocaleLowerCase()
                    .includes(q))
    );
}

export function readStore<T = any>(key: string, fallback: T): T {
    if (memory.has(key)) return memory.get(key);
    try {
        const raw = globalThis.localStorage?.getItem("sejong-v4:" + key);
        if (!raw) return fallback;
        const value = JSON.parse(raw);
        if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
        if (
            fallback &&
            typeof fallback === "object" &&
            !Array.isArray(fallback) &&
            (typeof value !== "object" || value === null)
        )
            return fallback;
        return value;
    } catch {
        return fallback;
    }
}

export function writeStore(key: string, value: any): boolean {
    memory.set(key, value);
    try {
        if (!globalThis.localStorage) return false;
        globalThis.localStorage.setItem("sejong-v4:" + key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export const todayISO = (): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

export const formatDate = (value?: string): string => String(value || "").replaceAll("-", ".");

export const money = (value?: number | string): string =>
    Number(value || 0).toLocaleString("ko-KR") + "원";

export function validateBooking(
    booking: { date?: string; time?: string; seats?: string[] },
    program?: Program
): { ok: boolean; error?: string } {
    if (
        !program ||
        !/^\d{4}-\d{2}-\d{2}$/.test(booking.date || "") ||
        (booking.date || "") < (program.start || "") ||
        (booking.date || "") > (program.end || "")
    )
        return { ok: false, error: "관람 가능한 날짜를 선택해 주세요." };
    if (!booking.time) return { ok: false, error: "관람 시간을 선택해 주세요." };
    if (
        !Array.isArray(booking.seats) ||
        !booking.seats.length ||
        booking.seats.length > 4 ||
        new Set(booking.seats).size !== booking.seats.length ||
        booking.seats.some((s) => !/^[A-F](?:[1-9]|1[0-2])$/.test(s))
    )
        return { ok: false, error: "좌석을 1~4개 선택해 주세요." };
    return { ok: true };
}

export function toast(message: string): void {
    if (typeof document === "undefined") return;
    const node = document.getElementById("toast") as (HTMLElement & { _timer?: any }) | null;
    if (!node) return;
    node.textContent = message;
    node.classList.add("visible");
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove("visible"), 3500);
}

export function navigate(path: string): void {
    if (typeof location !== "undefined") {
        location.hash = href(path);
    }
}

export { icon } from "../../assets/icons/material-symbols.js";
