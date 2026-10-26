"use client";

import React from "react";
import { isHeaderActionIcon } from "../src/system/component-contracts";
import type { HeaderActionIcon } from "../src/system/component-contracts";

const names: Record<string, string> = {
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

type IconProps = {
    className?: string;
    filled?: boolean;
} & (
    | { name: string; group?: "general"; size?: number }
    | { name: HeaderActionIcon; group: "header-action"; size?: never }
);

export default function Icon({ name, size = 24, group = "general", className = "", filled = false }: IconProps) {
    const symbol = names[name] || name || "arrow_forward";
    const hasFilledVariant = symbol === "favorite" || symbol === "lightbulb";

    return (
        <svg
            data-component-id="icon"
            data-icon-group={group === "header-action" && isHeaderActionIcon(name) ? "header-action" : "general"}
            className={`material-icon ${className}`.trim()}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
        >
            <use
                href={`/v5/assets/icons/material-symbols-rounded.svg#${hasFilledVariant && filled ? `${symbol}-fill` : symbol}`}
            />
        </svg>
    );
}
