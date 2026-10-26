const memory = new Map();
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const href = (path) => "#" + (path.startsWith("/") ? path : "/" + path);
export function getRoute() {
  const raw =
    typeof location === "undefined" ? "/" : location.hash.slice(1) || "/";
  const i = raw.indexOf("?");
  return {
    path: decodeURI(i < 0 ? raw : raw.slice(0, i)).replace(/\/$/, "") || "/",
    query: new URLSearchParams(i < 0 ? "" : raw.slice(i + 1)),
  };
}
export function filterPrograms(
  items,
  { category = "전체", date = "", search = "", genre = "", venue = "" } = {},
) {
  const q = search.trim().toLocaleLowerCase();
  return items.filter(
    (p) =>
      (!category || category === "전체" || p.category === category) &&
      (!date || (p.start <= date && p.end >= date)) &&
      (!genre || p.genre === genre) &&
      (!venue || p.venue === venue) &&
      (!q ||
        [p.title, p.genre, p.venue, p.description]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q)),
  );
}
export function readStore(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = globalThis.localStorage?.getItem("sejong:" + key);
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
export function writeStore(key, value) {
  memory.set(key, value);
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem("sejong:" + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const todayISO = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const formatDate = (value) => String(value || "").replaceAll("-", ".");
export const money = (value) =>
  Number(value || 0).toLocaleString("ko-KR") + "원";
export function validateBooking(booking, program) {
  if (
    !program ||
    !/^\d{4}-\d{2}-\d{2}$/.test(booking.date || "") ||
    booking.date < program.start ||
    booking.date > program.end
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
export function toast(message) {
  const node = document.getElementById("toast");
  if (!node) return;
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove("visible"), 3500);
}
export function navigate(path) {
  location.hash = href(path);
}
export { icon } from "../assets/icons/material-symbols.js";
