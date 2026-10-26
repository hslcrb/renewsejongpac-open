"use client";

import Link from "next/link";
import Icon from "./Icon";

// [시즌 탐색 배너 / A shared editorial season banner]
export default function SeasonBanner({ id = "home-season-programs" }: { id?: string }) {
    return (
        <Link data-text="action" href="/programs/season" className="home-season-link" id={id} data-home-anchor data-component="SeasonBanner" data-component-id="season-banner">
            <span>
                <strong data-text="item-title">한 편에서 시작하는, 나만의 시즌.</strong>
                <span data-text="body">세종시즌부터 Sync Next까지, 취향을 넓히는 기획 프로그램</span>
            </span>
            <span data-text="body">기획·시즌 살펴보기 <Icon name="arrow" size={22} /></span>
        </Link>
    );
}
