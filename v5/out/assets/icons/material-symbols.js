// Google Material Symbols Rounded. Keep the full library out of the page payload.
const sprite = new URL("./material-symbols-rounded.svg", import.meta.url).href;
const names = {
  arrow: "arrow_forward",
  back: "arrow_back",
  diagonal: "arrow_outward",
  up: "arrow_upward",
  search: "search",
  menu: "menu",
  close: "close",
  calendar: "calendar_month",
  pin: "location_on",
  ticket: "confirmation_number",
  user: "person",
  heart: "favorite",
  chevron: "chevron_right",
  clock: "schedule",
  plus: "add",
  check: "check",
  wheelchair: "accessible",
  car: "directions_car",
  building: "apartment",
  coffee: "local_cafe",
  mail: "mail",
  download: "download",
  play: "play_arrow",
  pause: "pause",
};

export const icon = (name, size = 24) => {
  const symbol = names[name] || names.arrow;
  const filled = symbol === "favorite";
  return `<svg class="material-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><use${filled ? ' class="material-icon-outline"' : ""} href="${sprite}#${symbol}"></use>${filled ? `<use class="material-icon-filled" href="${sprite}#favorite-fill"></use>` : ""}</svg>`;
};
