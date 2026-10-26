"use client";

import type { RoomTheme } from "../src/system/component-contracts";

import { useId } from "react";
import type { Program } from "../types/sejong.ts";
import { mediaPath } from "../src/lib/media";
import { SystemButton, SystemIconButton } from "./SystemPrimitives";
import Icon from "./Icon";

export interface AccountMiniRoomProps {
    name: string;
    message: string;
    theme: RoomTheme;
    lightOn: boolean;
    programs: readonly Program[];
    hasFavorites: boolean;
    onEdit?: () => void;
    onToggleLight?: () => void;
}

// [직접 구성한 미니어처와 실제 관심 공연 / An authored miniature with live favourite posters]
function MiniRoomArtwork({ instanceId, programs, lightOn }: {
    instanceId: string;
    programs: readonly Program[];
    lightOn: boolean;
}) {
    const paint = (name: string) => `url(#mini-room-${name}-${instanceId})`;
    const id = (name: string) => `mini-room-${name}-${instanceId}`;

    return (
        <svg
            className="mini-room-art"
            viewBox="0 0 960 710"
            role="img"
            aria-label={`벨벳 커튼의 작은 무대, 아치 창문, 파란 안락의자와 턴테이블, 책과 식물을 손수 배치한 나만의 공연장.${programs.length ? ` 벽에 걸린 공연 포스터: ${programs.map((program) => program.title).join(", ")}.` : ""} 조명 ${lightOn ? "켜짐" : "꺼짐"}.`}
        >
            <defs>
                <linearGradient id={id("floor")} x1="0" y1="0" x2="0.8" y2="1">
                    <stop stopColor="var(--color-detail-f5e4c7)" />
                    <stop offset="1" stopColor="var(--color-detail-ddc398)" />
                </linearGradient>
                <linearGradient id={id("edge")} x2="0" y2="1">
                    <stop stopColor="var(--color-detail-d5b88d)" />
                    <stop offset="1" stopColor="var(--color-detail-b59365)" />
                </linearGradient>
                <linearGradient id={id("wall")} x2="0.9" y2="1">
                    <stop stopColor="var(--color-white)" stopOpacity="0.34" />
                    <stop offset="0.65" stopColor="var(--color-white)" stopOpacity="0" />
                    <stop offset="1" stopColor="var(--color-detail-6f7868)" stopOpacity="0.13" />
                </linearGradient>
                <linearGradient id={id("velvet")}>
                    <stop stopColor="var(--color-detail-633c26)" />
                    <stop offset="0.2" stopColor="var(--mini-room-curtain)" />
                    <stop offset="0.52" stopColor="var(--color-detail-f0bc74)" />
                    <stop offset="0.74" stopColor="var(--mini-room-curtain)" />
                    <stop offset="1" stopColor="var(--color-detail-704329)" />
                </linearGradient>
                <linearGradient id={id("backstage")} x2="0" y2="1">
                    <stop stopColor="var(--color-detail-303c39)" />
                    <stop offset="1" stopColor="var(--color-detail-172b29)" />
                </linearGradient>
                <linearGradient id={id("chair")} x1="0.1" y1="0" x2="0.8" y2="1">
                    <stop stopColor="var(--color-detail-9ae0e8)" />
                    <stop offset="0.35" stopColor="var(--mini-room-chair)" />
                    <stop offset="1" stopColor="var(--color-detail-23849a)" />
                </linearGradient>
                <linearGradient id={id("ceramic")}>
                    <stop stopColor="var(--color-detail-d4cdba)" />
                    <stop offset="0.35" stopColor="var(--color-detail-faf6e8)" />
                    <stop offset="1" stopColor="var(--color-detail-ded6c2)" />
                </linearGradient>
                <linearGradient id={id("cabinet")} x2="0" y2="1">
                    <stop stopColor="var(--color-detail-bd8852)" />
                    <stop offset="1" stopColor="var(--color-detail-9d693c)" />
                </linearGradient>
                <linearGradient id={id("window")} x2="0" y2="1">
                    <stop stopColor="var(--color-detail-b8dadd)" />
                    <stop offset="1" stopColor="var(--color-detail-eaf2de)" />
                </linearGradient>
                <radialGradient id={id("light")}>
                    <stop stopColor="var(--color-detail-ffe7a3)" stopOpacity="0.8" />
                    <stop offset="0.52" stopColor="var(--color-detail-ffe2a1)" stopOpacity="0.25" />
                    <stop offset="1" stopColor="var(--color-detail-ffe2a1)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={id("stage-light")} cx="0.5" cy="0.8" r="0.85">
                    <stop stopColor="var(--color-detail-fce7ae)" stopOpacity="0.5" />
                    <stop offset="1" stopColor="var(--color-detail-fce7ae)" stopOpacity="0" />
                </radialGradient>
                <filter id={id("shadow")} x="-25%" y="-50%" width="150%" height="200%">
                    <feGaussianBlur stdDeviation="9" />
                </filter>
                <filter id={id("contact")} x="-25%" y="-60%" width="150%" height="220%">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
                <clipPath id={id("window-clip")}>
                    <path d="M279 158V67a31 31 0 0 1 62 0v91Z" />
                </clipPath>
            </defs>

            {/* [두께 있는 건축과 단풍나무 바닥 / Architecture and maple floor] */}
            <ellipse cx="484" cy="646" rx="313" ry="38" fill="var(--color-detail-5c503d)" opacity="0.14" filter={paint("shadow")} />
            <path d="M101 490 480 305 859 490 480 679Z" fill={paint("floor")} />
            <path d="M101 490 480 679v15L101 507Z" fill={paint("edge")} />
            <path d="m480 679 379-189v17L480 694Z" fill="var(--color-detail-ba976a)" />
            <path d="M101 490 480 679 859 490" fill="none" stroke="var(--color-detail-f7ead4)" strokeWidth="3" />
            <g fill="none" stroke="var(--color-detail-b99a70)" strokeWidth="1.2" opacity="0.45">
                <path d="m142 510 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185" />
                <path d="m206 458 51 25m132-115 51 25m-132 15 51 25m130-17 51 25m-130 17 51 25m131-16 51 25m-130 16 51 25m-388-27 51 25m132-116 51 25m-131 16 51 25m131-16 51 25m-131 16 51 25" />
            </g>
            <g fill="none" stroke="var(--color-detail-fff8e9)" strokeLinecap="round" opacity="0.37">
                <path d="m241 513 112-55m-16 102 86-42m126-19 117-57m-171-23 76-37m-148 234 87-43m60-1 117-57" />
            </g>
            <path d="M101 239 480 54v253L101 493Z" fill="var(--color-detail-c9c9b8)" />
            <path d="M480 54 859 239v254L480 307Z" fill="var(--color-detail-d0cdba)" />
            <path d="M108 246 480 64v244L108 490Z" className="mini-room-wall-left" />
            <path d="M480 64 852 246v244L480 308Z" className="mini-room-wall-right" />
            <path d="M108 246 480 64v244L108 490Z" fill={paint("wall")} />
            <path d="M480 64 852 246v244L480 308Z" fill={paint("wall")} />
            <path d="M101 239 480 54 859 239l-7 7L480 64 108 246Z" fill="var(--color-detail-fffdf2)" />
            <path d="M101 239v251l7 7V246m744 0v251l7-7V239" fill="var(--color-detail-e8e3d1)" />
            <path d="M113 471 480 292 847 471v15L480 307 113 486Z" fill="var(--color-detail-d9d6c5)" />
            <path d="m113 471 367-179 367 179" fill="none" stroke="var(--color-detail-faf8e9)" strokeWidth="4" />
            <path d="M480 66v225" stroke="var(--color-detail-8d9988)" strokeOpacity="0.2" strokeWidth="3" />

            {/* [아치 창과 린넨 커튼 / Arched window with linen curtains] */}
            <g transform="matrix(1 -.49 0 1 108 246)">
                <path d="M269 170V67a41 41 0 0 1 82 0v103Z" fill="var(--color-detail-8e9d8c)" opacity="0.2" />
                <path d="M273 163V67a37 37 0 0 1 74 0v96Z" fill="var(--color-detail-b8ae92)" />
                <path d="M279 158V67a31 31 0 0 1 62 0v91Z" fill={paint("window")} />
                <g clipPath={paint("window-clip")}>
                    <path d="M275 136c18-23 30-14 39-29 10-14 22-5 32-16v72h-71Z" fill="var(--color-detail-b4c8aa)" />
                    <path d="M275 150c22-17 42-7 70-27v40h-70Z" fill="var(--color-detail-93ac91)" />
                    <path d="M292 73c8-8 14-4 18 0 4-2 10-1 12 4h-33Z" fill="var(--color-white)" opacity="0.7" />
                    <path d="M283 53v106m27-121v121m28-106v106M279 92h63" fill="none" stroke="var(--color-detail-faf8ea)" strokeWidth="5" />
                </g>
                <path d="M276 160V67a34 34 0 0 1 68 0v93Z" fill="none" stroke="var(--color-detail-f9f7e9)" strokeWidth="5" />
                <path d="M268 162h84l-5 8h-84Z" fill="var(--color-detail-fffbea)" />
                <path d="M263 170h84v6h-84Z" fill="var(--color-detail-ccc6ad)" />
                <path d="M265 44c-4 31 1 70-5 114l16 3c-2-35 4-80 1-117Zm79 0c-2 40 5 80 0 117l15-3c-6-44 1-89-4-114Z" fill="var(--color-detail-f5edd8)" />
                <path d="M268 47c-2 32 2 72-3 107m83-107c-1 39 5 71 1 107" fill="none" stroke="var(--color-detail-d9cfb7)" strokeWidth="3" />
                <path d="M260 42h100" stroke="var(--color-detail-9e7c50)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="259" cy="42" r="4" fill="var(--color-detail-c8a568)" />
                <circle cx="361" cy="42" r="4" fill="var(--color-detail-c8a568)" />
                <path d="m283 164 6-20h12l6 20Z" fill="var(--color-detail-d19972)" />
                <path d="M295 145v-25m0 17c-13-1-14-12-14-12 11-1 15 3 14 12Zm1-9c13 1 17-10 17-10-11-3-16 2-17 10Z" fill="var(--color-detail-718c62)" />
            </g>
            <path d="m400 379 60-30 129 61-61 30Z" fill="var(--color-detail-f8f3ca)" opacity="0.25" />
            <path d="m409 382 22-11 129 62-22 11m-98-77 19-9 129 62-19 9" fill="var(--color-detail-fff9da)" opacity="0.22" />

            {/* [목재 프로시니엄과 벨벳 주름 / Timber proscenium and velvet folds] */}
            <path d="m134 474 221-108 73 36-221 109Z" fill="var(--color-detail-cfa778)" />
            <path d="m134 474 73 37v14l-73-37Z" fill="var(--color-detail-a97748)" />
            <path d="m207 511 221-109v14L207 525Z" fill="var(--color-detail-b98d5c)" />
            <path d="m146 474 209-102 60 30-208 102Z" fill="var(--color-detail-e2c59a)" />
            <path d="m166 478 187-91m-166 102 188-92" stroke="var(--color-detail-c5a271)" strokeWidth="1.5" />
            <g transform="matrix(1 -.49 0 1 108 246)">
                <path d="M25 242V86C25 28 251 28 251 86v156Z" fill="var(--color-detail-a77f53)" />
                <path d="M32 242V87C32 36 244 36 244 87v155Z" fill="var(--color-detail-e1c69d)" />
                <path d="M43 241V89C43 49 233 49 233 89v152Z" fill={paint("backstage")} />
                <path d="M46 238V93C46 57 230 57 230 93v145Z" fill="none" stroke="var(--color-detail-805e3d)" strokeWidth="4" />
                <path d="M52 100c35 8 57-1 86-13 29 12 53 21 86 13V82c-42-20-130-20-172 0Z" fill={paint("velvet")} />
                <path d="M52 91c35 22 38 64 5 120l-5 27Zm172 0c-35 22-38 64-5 120l5 27Z" fill={paint("velvet")} />
                <path d="M59 104c18 31 13 60 1 88m11-83c14 27 11 52-3 81m149-86c-18 31-13 60-1 88m-11-83c-14 27-11 52 3 81" fill="none" stroke="var(--color-detail-553a2b)" strokeWidth="3" strokeOpacity="0.32" />
                <path d="M58 86c21 9 52 7 80-3 28 10 58 12 80 3" fill="none" stroke="var(--color-detail-ffe2a6)" strokeWidth="2" strokeOpacity="0.5" />
                <path d="m53 196 21 5m128 0 21-5" stroke="var(--color-detail-e8c982)" strokeWidth="5" />
                <path d="m58 199 6 13m152-13-6 13" stroke="var(--color-detail-d5ab5d)" strokeWidth="2" />
                <path d="M42 70c33-31 160-31 193 0" fill="none" stroke="var(--color-detail-f6e7ca)" strokeWidth="3" />
                <path d="M37 94v143m202-143v143" stroke="var(--color-detail-b09165)" strokeWidth="3" />
                <g className="mini-room-glow">
                    <path d="m94 84-28 155h144L183 84Z" fill={paint("stage-light")} />
                    <ellipse cx="138" cy="227" rx="71" ry="13" fill="var(--color-detail-ffe3a4)" opacity="0.18" />
                </g>
                <path d="M91 65v13m95-13v13" stroke="var(--color-detail-665840)" strokeWidth="3" />
                <rect x="80" y="75" width="23" height="11" rx="4" fill="var(--color-detail-39443e)" />
                <rect x="174" y="75" width="23" height="11" rx="4" fill="var(--color-detail-39443e)" />
                <path d="M84 86h15m79 0h15" className="mini-room-light-strip" strokeWidth="3" />

                {/* [작은 그랜드 피아노 / Miniature grand piano] */}
                <ellipse cx="144" cy="229" rx="56" ry="9" fill="var(--color-detail-071d1b)" opacity="0.4" />
                <path d="m112 206-3 24m68-24 4 24m-43-28v24" stroke="var(--color-detail-ba9860)" strokeWidth="4" strokeLinecap="round" />
                <path d="M108 171c-2-14 6-22 20-23 25-2 37 16 52 20v36h-72Z" fill="var(--color-detail-182c2a)" />
                <path d="M108 171c-2-14 6-22 20-23 25-2 37 16 52 20v10h-72Z" fill="var(--color-detail-50635b)" />
                <path d="M111 169c3-15 16-15 28-9 13 7 21 11 35 11" fill="none" stroke="var(--color-detail-889486)" strokeWidth="2" />
                <path d="M108 179h75v8h-75Z" fill="var(--color-detail-0f2524)" />
                <path d="M109 180h72v5h-72Z" fill="var(--color-detail-f1e8cf)" />
                <path d="M115 180v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4" stroke="var(--color-detail-192d2b)" strokeWidth="3" />
                <path d="M128 167v-15h24v15Z" fill="var(--color-detail-a59570)" />
                <path d="M130 165v-11l10 2 10-2v11l-10 2Z" fill="var(--color-detail-f3ecd8)" />
                <path d="M140 156v11" stroke="var(--color-detail-c7b98e)" />
                <rect x="121" y="209" width="32" height="8" rx="3" fill="var(--color-detail-714e38)" />
                <path d="M125 216v12m24-12v12" stroke="var(--color-detail-bea06c)" strokeWidth="3" />
            </g>

            {/* [실제 공연이 담긴 액자와 갤러리 조명 / Real programme frames and gallery lighting] */}
            <g transform="matrix(1 .49 0 1 480 64)">
                <path d="M29 45h301" stroke="var(--color-detail-a09377)" strokeWidth="3" strokeLinecap="round" />
                {programs.map((program, index) => {
                    const x = 35 + index * 99;
                    return (
                        <g key={program.id}>
                            <path d={`M${x + 37} 46v18`} stroke="var(--color-detail-a39983)" strokeWidth="1.5" />
                            <rect x={x + 3} y="71" width="82" height="122" rx="3" fill="var(--color-detail-6c7363)" opacity="0.15" />
                            <rect x={x - 4} y="64" width="82" height="122" rx="3" fill="var(--color-detail-72563b)" />
                            <rect x={x - 1} y="67" width="76" height="116" fill="var(--color-detail-f7eedb)" />
                            <image href={mediaPath(program.image)} x={x + 3} y="71" width="68" height="108" preserveAspectRatio="xMidYMid slice" />
                            <path d={`M${x - 2} 65h78M${x - 2} 65v119`} fill="none" stroke="var(--color-detail-d5b786)" strokeWidth="1.5" />
                            <path d={`m${x + 60} 72-56 96v-17l47-79Z`} fill="var(--color-white)" opacity="0.08" />
                        </g>
                    );
                })}
                <path d="M94 40v11m99-11v11m99-11v11" stroke="var(--color-detail-8c7c58)" strokeWidth="3" />
                <path d="M83 51h22m77 0h22m77 0h22" stroke="var(--color-detail-b29961)" strokeWidth="6" strokeLinecap="round" />
                <path d="M85 55h18m81 0h18m81 0h18" className="mini-room-light-strip" strokeWidth="2" />
                <g className="mini-room-glow" opacity="0.45">
                    <path d="m88 58-26 109h63L100 58Zm99 0-26 109h63L199 58Zm99 0-26 109h63L298 58Z" fill={paint("stage-light")} />
                </g>
            </g>

            {/* [레코드장과 책, 손으로 놓은 턴테이블 / Record console, books and a hand-placed turntable] */}
            <path d="m461 382 285 139 39-18-287-140Z" fill="var(--color-detail-756044)" opacity="0.13" filter={paint("contact")} />
            <g transform="matrix(1 .49 0 1 480 64)">
                <path d="m-19 314-2 18m275-18 3 18m-242-36 1 13m236-13v13" stroke="var(--color-detail-755336)" strokeWidth="6" strokeLinecap="round" />
                <path d="M22 223h291l-45 45H-23Z" fill="var(--color-detail-d6b585)" />
                <path d="m-23 268 291 0v52H-23Z" fill={paint("cabinet")} />
                <path d="m268 268 45-45v52l-45 45Z" fill="var(--color-detail-8e603c)" />
                <path d="M-23 268h291v5H-23Z" fill="var(--color-detail-e3c799)" />
                <path d="M-13 281h91v31h-91Z" fill="var(--color-detail-6b5037)" />
                <path d="M89 280h83v34H89Zm92 0h76v34h-76Z" fill="var(--color-detail-bd8954)" stroke="var(--color-detail-a47245)" />
                <path d="M128 286v6m91-6v6" stroke="var(--color-detail-d9be81)" strokeWidth="3" strokeLinecap="round" />
                <path d="M-7 285h10v26H-7Z" fill="var(--color-detail-ead7a5)" />
                <path d="M5 283h8v28H5Z" fill="var(--color-detail-627d76)" />
                <path d="M15 286h8v25h-8Z" fill="var(--color-detail-c98151)" />
                <path d="M26 282h10v29H26Z" fill="var(--color-detail-dbcfb5)" />
                <path d="m40 286 8-2 7 26-8 2Z" fill="var(--color-detail-556a70)" />
                <path d="M58 304h14v7H58Z" fill="var(--color-detail-c1ad85)" />
                <path d="M-9 290H1m6 14h5m5-10h5m6 10h7" stroke="var(--color-detail-f5e6bb)" strokeWidth="1.5" />
                <path d="m52 219 86 0-27 28H25Z" fill="var(--color-detail-715640)" />
                <path d="m25 247 86 0v7H25Z" fill="var(--color-detail-4f4435)" />
                <path d="m111 247 27-28v7l-27 28Z" fill="var(--color-detail-5e4935)" />
                <path d="m55 222 74 0-20 21H35Z" fill="var(--color-detail-c5ab7d)" />
                <ellipse cx="77" cy="232" rx="28" ry="9" fill="var(--color-detail-273735)" />
                <ellipse cx="77" cy="232" rx="21" ry="6" fill="none" stroke="var(--color-detail-6b7666)" strokeWidth="1" />
                <ellipse cx="77" cy="232" rx="8" ry="3" fill="var(--color-detail-e4b257)" />
                <path d="m120 225-15 7-6 9" fill="none" stroke="var(--color-detail-ece3c5)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="124" cy="225" r="3" fill="var(--color-detail-6b6750)" />
                <path d="m40 214 19-18 83 0-4 23H52Z" fill="var(--color-detail-cdddce)" opacity="0.3" stroke="var(--color-detail-f8f4dd)" strokeWidth="1.5" />
                <path d="m167 228 40 0-13 13h-40Z" fill="var(--color-detail-e4d9bf)" />
                <path d="m154 241 40 0v5h-40Z" fill="var(--color-detail-a9b3a6)" />
                <path d="m161 223 37 0-12 12h-37Z" fill="var(--color-detail-bf7250)" />
                <path d="m149 235 37 0v5h-37Z" fill="var(--color-detail-e5bf92)" />
                <path d="M241 220h22l-3 19h-16Z" fill={paint("ceramic")} />
                <ellipse cx="252" cy="220" rx="11" ry="4" fill="var(--color-detail-b9ad91)" />
                <path d="M252 220v-28m0 16c-14 0-18-13-18-13 13-3 18 4 18 13Zm0-9c12 0 18-11 18-11-12-4-18 2-18 11Z" fill="var(--color-detail-718b65)" />
            </g>

            {/* [낮은 울 러그와 편안한 안락의자 / Low wool rug and upholstered reading chair] */}
            <path d="M357 465c49-24 85-31 120-14l152 74c34 17 34 37-5 56l-69 34c-29 15-64 15-96-1l-157-77c-28-13-20-34 10-49Z" fill="var(--color-detail-9e8767)" opacity="0.13" />
            <path d="M354 457c49-24 85-31 120-14l152 74c34 17 34 37-5 56l-69 34c-29 15-64 15-96-1l-157-77c-28-13-20-34 10-49Z" fill="var(--color-detail-f3edd9)" />
            <path d="M359 467c44-22 78-27 108-12l146 71c27 13 27 26-5 42l-62 31c-26 12-54 12-81-1l-150-73c-20-10-16-22 10-35Z" fill="none" stroke="var(--color-detail-d7d0b8)" strokeWidth="3" />
            <path d="m323 509 275 38m-245-54 218 86m-242-66 254 49" fill="none" stroke="var(--color-detail-fffbea)" strokeWidth="2" opacity="0.45" />
            <ellipse cx="432" cy="517" rx="78" ry="24" fill="var(--color-detail-5c685c)" opacity="0.16" filter={paint("contact")} />
            <path d="m371 486-4 31m97-1 8 26m-14-72 9 26" stroke="var(--color-detail-8d683f)" strokeWidth="7" strokeLinecap="round" />
            <path d="M355 427c-5-40 26-56 63-40l48 24c16 8 21 20 17 40l-9 49c-2 15-13 21-29 15l-72-35c-13-6-20-19-18-34Z" fill="var(--color-detail-25849b)" />
            <path d="M362 425c-3-27 19-39 48-26l48 24c12 6 14 14 11 27l-8 37c-2 8-8 10-17 6l-66-32c-11-5-17-11-16-22Z" fill={paint("chair")} />
            <path d="M373 406c14-4 25-1 39 6l38 19c7 3 11 8 11 14" fill="none" stroke="var(--color-detail-cbf0e8)" strokeWidth="2" opacity="0.6" />
            <path d="m371 465 48-23 57 28-45 26Z" fill="var(--color-detail-79d0dc)" />
            <path d="m371 465 60 31v15l-60-30Z" fill="var(--color-detail-3caac0)" />
            <path d="m431 496 45-26-2 17-43 24Z" fill="var(--color-detail-2d97ae)" />
            <path d="M353 442c0-9 8-12 16-8l13 7c5 2 8 8 7 14l-3 23c-1 9-8 13-16 8l-9-5c-6-3-9-8-9-15Z" fill={paint("chair")} />
            <path d="M449 488c0-10 7-15 15-11l14 7c6 3 8 8 6 15l-3 12c-2 9-9 12-16 8l-10-5c-5-3-7-8-7-14Z" fill={paint("chair")} />
            <path d="m402 429 19-8c4-2 7-1 10 2l13 20c3 4 2 8-2 10l-20 9c-4 2-7 0-9-3l-15-20c-2-4-1-7 4-10Z" fill="var(--color-detail-f5e8c7)" />
            <path d="m408 432 25 21m-15-25 13 30" stroke="var(--color-detail-c7b991)" strokeWidth="1.5" />

            {/* [차와 펼친 책이 놓인 원목 테이블 / Timber table with tea and an open book] */}
            <ellipse cx="546" cy="551" rx="55" ry="18" fill="var(--color-detail-726348)" opacity="0.14" filter={paint("contact")} />
            <path d="m513 517-9 39m68-34 9 35m-37-55v31" stroke="var(--color-detail-9d774a)" strokeWidth="6" strokeLinecap="round" />
            <path d="M492 506c0-17 26-28 54-28s54 11 54 28v9c0 17-26 28-54 28s-54-11-54-28Z" fill="var(--color-detail-c5a16e)" />
            <ellipse cx="546" cy="506" rx="54" ry="27" fill="var(--color-detail-e7cda1)" />
            <ellipse cx="546" cy="504" rx="48" ry="22" fill="none" stroke="var(--color-detail-f4e1bb)" strokeWidth="1.5" />
            <path d="m512 507 17-9 23 10 19-6-4 15-17 8-23-11-17 5Z" fill="var(--color-detail-c7ad7d)" />
            <path d="m512 502 17-8 23 10 19-6-3 15-17 8-23-11-17 5Z" fill="var(--color-detail-fff7df)" />
            <path d="m529 494-1 16 23 11 1-17" fill="var(--color-detail-ebe0c2)" />
            <path d="m533 500 14 6m-15-1 14 6m-15-1 14 6m12-9 9-4m-10 9 9-4" stroke="var(--color-detail-b7ab8a)" strokeWidth="1" />
            <ellipse cx="567" cy="491" rx="15" ry="6" fill="var(--color-detail-c9af82)" />
            <path d="M557 479h18v10c0 7-18 7-18 0Z" fill="var(--color-detail-f7f2de)" />
            <path d="M575 481c11-2 10 10 0 9" fill="none" stroke="var(--color-detail-f7f2de)" strokeWidth="3" />
            <ellipse cx="566" cy="479" rx="9" ry="4" fill="var(--color-detail-fdf8e8)" />
            <ellipse cx="566" cy="479" rx="6.5" ry="2.5" fill="var(--color-detail-947450)" />
            <path d="M563 470c-5-7 5-9 1-16m6 18c-4-5 4-8 1-13" fill="none" stroke="var(--color-detail-ffffee)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

            {/* [주름 갓의 독서등과 큰 화분 / Pleated reading lamp and a large ceramic planter] */}
            <ellipse cx="677" cy="495" rx="29" ry="12" fill="var(--color-detail-665c42)" opacity="0.12" filter={paint("contact")} />
            <ellipse cx="677" cy="485" rx="25" ry="11" fill="var(--color-detail-9a8256)" />
            <ellipse cx="677" cy="482" rx="24" ry="9" fill="var(--color-detail-b9a47c)" />
            <path d="M677 480V345c0-13-10-22-23-22h-16" fill="none" stroke="var(--color-detail-ae9465)" strokeWidth="5" />
            <path d="M677 479V345c0-13-10-22-23-22" fill="none" stroke="var(--color-detail-e2cea0)" strokeWidth="1.5" />
            <g className="mini-room-glow">
                <ellipse cx="637" cy="430" rx="114" ry="101" fill={paint("light")} />
                <path d="m615 345-60 155c40 24 113 26 154 7l-49-162Z" fill="var(--color-detail-ffe6a5)" opacity="0.09" />
                <ellipse cx="633" cy="506" rx="81" ry="27" fill={paint("light")} />
            </g>
            <path d="M617 311h34l17 42c-13 12-54 12-68 0Z" fill="var(--color-detail-ccb276)" />
            <path d="M619 311h30l15 40c-16 8-47 8-60 0Z" className="mini-room-lampshade" />
            <path d="m620 315-9 34m15-35-4 38m11-38v39m7-39 5 38m1-38 11 35" stroke="var(--color-detail-bda876)" strokeWidth="1.6" opacity="0.65" />
            <ellipse cx="634" cy="311" rx="17" ry="5" fill="var(--color-detail-e5d4a8)" />
            <ellipse cx="634" cy="354" rx="33" ry="8" fill="var(--color-detail-c8b37f)" />
            <ellipse cx="634" cy="354" rx="27" ry="5" className="mini-room-bulb" />
            <path d="M632 303v4" stroke="var(--color-detail-ae9465)" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="755" cy="533" rx="35" ry="13" fill="var(--color-detail-66573f)" opacity="0.15" filter={paint("contact")} />
            <path d="M728 478h51l-6 48c-2 16-38 16-40 0Z" fill={paint("ceramic")} />
            <ellipse cx="753.5" cy="478" rx="25.5" ry="11" fill="var(--color-detail-faf6e6)" />
            <ellipse cx="753.5" cy="478" rx="20" ry="7" fill="var(--color-detail-a29476)" />
            <path d="M754 478v-97m0 72-25-33m25 15 28-36m-28 3-13-36" fill="none" stroke="var(--color-detail-667d53)" strokeWidth="4" strokeLinecap="round" />
            <path d="M753 405c-30-1-45-29-39-45 28-1 43 16 39 45Z" fill="var(--color-detail-7c976b)" />
            <path d="M754 393c-9-29 5-49 24-51 14 25 3 46-24 51Z" fill="var(--color-detail-91a778)" />
            <path d="M774 420c-4-31 18-50 38-45 2 27-12 45-38 45Z" fill="var(--color-detail-69865c)" />
            <path d="M742 439c-29 4-47-17-44-38 28-3 45 13 44 38Z" fill="var(--color-detail-a0b188)" />
            <path d="M755 462c16-28 38-29 54-15-10 23-30 30-54 15Z" fill="var(--color-detail-839d6b)" />
            <path d="m719 366 27 30m29-47-18 39m49-8-25 32m-78-6 31 26m66 16-38 12" fill="none" stroke="var(--color-detail-dfe6c6)" strokeWidth="1.5" strokeOpacity="0.4" />

            {/* [직접 만든 작은 오토만과 접은 담요 / Small upholstered ottoman and folded throw] */}
            <ellipse cx="440" cy="592" rx="36" ry="12" fill="var(--color-detail-8b7657)" opacity="0.12" filter={paint("contact")} />
            <path d="m412 575-2 17m54-15 2 16" stroke="var(--color-detail-a38055)" strokeWidth="5" strokeLinecap="round" />
            <path d="M404 555c0-11 16-19 36-19s36 8 36 19v17c0 11-16 19-36 19s-36-8-36-19Z" fill="var(--color-detail-ba8c62)" />
            <ellipse cx="440" cy="555" rx="36" ry="19" fill="var(--color-detail-d8b68a)" />
            <ellipse cx="440" cy="553" rx="30" ry="14" fill="none" stroke="var(--color-detail-f0d5aa)" strokeWidth="1.5" />
            <path d="m417 542 16-8 31 16-16 10v24l-13-6v-23Z" fill="var(--color-detail-e7d7b0)" />
            <path d="m424 540 28 16v21m-21-40 28 16m-24 4 13 7m-13-1 13 7" fill="none" stroke="var(--color-detail-b9ac82)" strokeWidth="1.5" />
            <path d="m437 578-1 6m5-4v6m5-3v6" stroke="var(--color-detail-e7d7b0)" strokeWidth="2" />

            {/* [조명 상태에 따라 달라지는 실내의 저녁 빛 / Dusk tint follows the actual light state] */}
            <path d="M108 246 480 64 852 246v244L480 679 108 490Z" className="mini-room-dusk" />
        </svg>
    );
}

// [취향이 걸린 작은 공연장 / A little theatre for personal favourites]
export default function AccountMiniRoom({
    name,
    message,
    theme,
    lightOn,
    programs,
    hasFavorites,
    onEdit,
    onToggleLight,
}: AccountMiniRoomProps) {
    const instanceId = useId().replaceAll(":", "");
    const headingId = `mini-room-heading-${instanceId}`;
    const posters = programs.slice(0, 3);
    const lightLabel = lightOn ? "공연장 조명이 켜져 있어요. 조명 끄기" : "공연장 조명이 꺼져 있어요. 조명 켜기";

    return (
        <section className="account-mini-room" data-component="AccountMiniRoom" data-component-id="account-mini-room" data-theme={theme} data-light={lightOn ? "on" : "off"} aria-labelledby={headingId}>
            {/* [제목과 공통 조작 / Heading and shared controls] */}
            <header className="mini-room-header">
                <h2 data-text="heading" id={headingId}>나의 작은 공연장</h2>
                <div className="mini-room-actions">
                    <SystemIconButton data-text="action"
                        variant="secondary"
                        aria-label={lightLabel}
                        aria-pressed={lightOn}
                        onClick={onToggleLight}
                        disabled={!onToggleLight}
                        title={lightOn ? "조명 끄기" : "조명 켜기"}
                    >
                        <Icon name="lightbulb" filled={lightOn} />
                    </SystemIconButton>
                    <SystemButton data-text="action" variant="secondary" onClick={onEdit} disabled={!onEdit}>공간 꾸미기</SystemButton>
                </div>
            </header>

            {/* [한마디와 고정 구성 미니어처 / Personal note and fixed authored miniature] */}
            <figure className="mini-room-figure">
                <div className="mini-room-scene" data-note-layout={message.length > 40 || name.length > 16 ? "flow" : "overlay"}>
                    <blockquote data-text="body" className="mini-room-note">
                        <p data-text="body">{message}</p>
                        <cite data-text="meta">{name}의 공연장</cite>
                    </blockquote>
                    <MiniRoomArtwork instanceId={instanceId} programs={posters} lightOn={lightOn} />
                </div>
                <figcaption data-text="caption" className="mini-room-caption">
                    <p data-text="body">{hasFavorites ? "관심 공연을 포스터로 걸어 두었어요." : "아직 관심 공연이 없어, 세종의 추천 공연을 걸어 두었어요."}</p>
                    <span data-text="body" className="mini-room-light-status">조명 {lightOn ? "켜짐" : "꺼짐"}</span>
                </figcaption>
            </figure>
        </section>
    );
}
