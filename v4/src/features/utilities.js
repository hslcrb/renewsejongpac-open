import { renderSearch } from "./search.js";
import { PAGES, NAV, PROGRAMS } from "../data/catalog.js";
import { esc, href, icon } from "../lib/core.js";
import { pageHeader, button, emptyState } from "../components/ui.js";
import { animateFeedback, cancelMotion } from "../components/motion.js";
export function renderUtilities(path, query) {
    const meta = PAGES.find((p) => p.path === path);
    if (path === "/sitemap")
        return `${pageHeader({ ...meta, description: "모든 예술, 모든 공간. 세종의 전체 페이지를 한눈에 만나보세요." })}<div class="container page-content"><p class="demo-note" style="margin-bottom:30px">${PAGES.length}개 콘텐츠 페이지와 예매·신청 흐름으로 연결됩니다.</p><div class="sitemap-grid">${[
            ...NAV,
            { id: "account", title: "나의 세종" },
            { id: "utility", title: "기타 안내" },
        ]
            .map(
                (n) =>
                    `<section class="sitemap-group"><h2>${n.title}</h2>${PAGES.filter(
                        (p) => p.group === n.id,
                    )
                        .map(
                            (p) =>
                                `<a href="${href(p.path)}" data-depth="${p.path.split("/").length > 3 ? 3 : 2}">${esc(p.title)} ${p.type === "program" ? icon("diagonal", 16) : ""}</a>`,
                        )
                        .join("")}</section>`,
            )
            .join("")}</div></div>`;
    if (path === "/search") return renderSearch(query);
    if (path.startsWith("/policy/") && meta) {
        const text = path.endsWith("privacy")
            ? [
                    [
                        "1. 이 체험 사이트에서 저장하는 정보",
                        "관심 프로그램, 예매·신청 체험 내역, 굿즈 장바구니·주문 체험 내역 및 사용자가 입력한 체험 프로필은 이 브라우저의 로컬 저장소에만 저장됩니다. 별도 서버로 전송하거나 실제 기관의 회원정보와 연결하지 않습니다.",
                    ],
                    [
                        "2. 이용 목적과 보유 기간",
                        "프로그램 탐색, 관심 목록 및 신청·예매 흐름의 화면 체험을 제공합니다. 데이터는 브라우저 저장소를 삭제할 때까지 현재 기기에 보관됩니다. 공용 기기에서는 체험 완료 후 저장된 정보를 삭제해 주세요.",
                    ],
                    [
                        "3. 정보의 삭제",
                        "마이페이지의 내 정보 화면에서 체험 프로필을 관리할 수 있습니다. 전체 데이터를 삭제하려면 브라우저 설정에서 이 사이트의 저장소를 삭제해 주세요. 비밀번호와 결제수단 정보는 수집하지 않습니다.",
                    ],
                    [
                        "4. 외부 링크",
                        "공식 홈페이지 등 외부 사이트로 이동하면 해당 서비스의 개인정보처리방침이 적용됩니다. 본 화면은 리뉴얼 체험을 위한 안내이며 공식 세종문화회관의 개인정보처리방침을 대체하지 않습니다.",
                    ],
                ]
            : path.endsWith("terms")
                ? [
                        [
                            "제1조 목적",
                            "이 사이트는 세종문화회관 웹사이트 분석 자료를 기반으로 제작한 프런트엔드 리뉴얼 체험물입니다. 문화예술 프로그램과 관련 정보를 탐색하고 이용 흐름을 체험하는 데 목적이 있습니다.",
                        ],
                        [
                            "제2조 서비스의 범위",
                            "공연·전시·교육 검색, 관심 프로그램 저장, 가상 예매, 대관·교육·채용 등 신청, 굿즈 장바구니·주문, 공개자료 열람과 방문 동선 안내를 제공합니다. 모든 일정, 요금, 좌석과 접수·주문번호는 체험을 위한 예시입니다.",
                        ],
                        [
                            "제3조 예매 및 신청",
                            "예약·신청·주문 완료 화면은 실제 티켓, 예약, 수강권, 대관 승인, 채용 접수 또는 상품 구매·결제 내역의 효력을 갖지 않습니다. 실제 서비스 이용은 세종문화회관 공식 홈페이지에서 확인해 주세요.",
                        ],
                        [
                            "제4조 저작물",
                            "첨부 분석 자료에서 추출한 이미지의 권리는 원 저작권자에게 있습니다. 새로 제작한 이미지와 일러스트는 리뉴얼 시연용이며 실제 공연 사진 및 시설 실측도가 아닙니다.",
                        ],
                    ]
                : [
                        [
                            "이메일 무단수집을 거부합니다",
                            "본 웹사이트에 게시된 이메일 주소를 자동 수집 프로그램이나 기술적 장치를 이용해 무단으로 수집하는 행위를 거부합니다.",
                        ],
                        [
                            "문의 방법",
                            "사이트 이용 관련 문의는 고객지원의 문의하기 화면을 이용해 주세요. 이 체험 사이트에서는 외부로 문의를 전송하지 않습니다.",
                        ],
                    ];
        return `${pageHeader(meta)}<div class="container page-content policy-content"><p class="demo-note">최종 작성: 2026.10.13 · 프런트엔드 체험 사이트 안내</p>${text.map(([h, p]) => `<section><h2>${h}</h2><p>${p}</p></section>`).join("")}<div style="margin-top:35px">${button("고객지원", "/visit/support")}</div></div>`;
    }
    if (path === "/english")
        return `${pageHeader({ ...meta, description: "A place for arts. A place for everyone." })}<div class="container page-content"><div class="english-grid"><section><p class="eyebrow">WELCOME TO SEJONG</p><h2>Art in the heart of Seoul.</h2><p>Since 1978, Sejong Center has connected people through music, theater, dance and visual arts. Explore the programs and plan your visit.</p>${button("Explore programs", "/programs")}</section><section><p class="eyebrow">GETTING HERE</p><h2>Plan your visit.</h2><p>175 Sejong-daero, Jongno-gu, Seoul<br>Subway Line 5, Gwanghwamun Station, Exit 1 or 8<br>Information: +82-2-399-1000</p>${button("Directions & parking", "/visit/directions")}</section><section><h2>Accessibility</h2><p>Wheelchair seating and accessible routes are available. Please review each venue’s access information before your visit.</p>${button("Accessible visit", "/visit/accessibility")}</section><section><h2>Venue rental</h2><p>Find a stage for your next story. Discover our theaters, chamber hall and gallery, and explore the rental process.</p>${button("Rental information", "/rental")}</section></div><p class="demo-note" style="margin-top:30px">This is a frontend redesign demonstration. Program dates and prices are examples. No real bookings, payments, or applications are made. Detailed pages are in Korean.</p></div>`;
    return null;
}
// [검색 요청과 결과의 피드백 / Search request and result feedback]
// 같은 검색어를 다시 제출해도 현재 결과를 알려 주며 입력 포커스는 보존합니다.
// A repeated query acknowledges the existing result without replacing the focused input.
export function bindUtilities(root, path) {
    const form = root.querySelector("#search-page-form");
    if (!form) return;
    const events = new AbortController();
    const result = root.querySelector(".search-count");
    if (result) {
        result.setAttribute("role", "status");
        result.setAttribute("aria-atomic", "true");
    }
    form.addEventListener("invalid", (event) => animateFeedback(event.target, "error"), { capture: true, signal: events.signal });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q").trim();
        const destination = href("/search?q=" + encodeURIComponent(q));
        if (location.hash === destination) {
            const feedback = result || root.querySelector(".empty-state");
            animateFeedback(feedback, "status");
            if (result) result.replaceChildren(...[...result.childNodes].map((node) => node.cloneNode(true)));
        } else location.hash = destination;
    }, { signal: events.signal });
    return () => {
        events.abort();
        cancelMotion(form);
        cancelMotion(result);
    };
}
