// /* [보존된 v4 바닐라 동작 참고 / Preserved v4 vanilla behavior reference]
//    v4 원본 DOM 동작을 v5 비교·검증용으로 그대로 담아 두었고, 해당 파일군은 타입 검사를 생략한다.
//    Keeps the original v4 DOM behavior intact for v5 comparison and testing, without type checking. */
// @ts-nocheck
import { PROGRAMS } from "../data/catalog.ts";
import { esc, icon } from "../lib/core.ts";
import {
    seoulToday, monthDates, moveMonth, programsForDate, canSelectProgram,
    createBookingState, changeBookingState, bookingDestination,
} from "./home-domain.ts";

const dateLabel = date => !date ? "날짜를 선택하세요" : new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul",
}).format(new Date(`${date}T03:00:00Z`));

// [오늘과 선택 날짜 / Today and the selected date]
// 날짜 선택은 회차 선택과 독립적이며 월 이동만으로 예매일을 바꾸지 않습니다.
// Choosing a month never commits a different booking date.
function calendarMarkup(state, today) {
    const cells = monthDates(state.month);
    const entryDate = state.date.startsWith(state.month) ? state.date : cells.find(Boolean);
    return `<div class="quick-calendar-heading">
        <h3 id="quick-month" aria-live="polite">${state.month.replace("-", ". ")}</h3>
        <div class="quick-month-controls">
            <button type="button" data-quick-month="-1" aria-label="이전 달">${icon("back", 20)}</button>
            <button type="button" data-quick-today>오늘</button>
            <button type="button" data-quick-month="1" aria-label="다음 달">${icon("arrow", 20)}</button>
        </div>
    </div>
    <label class="quick-native-date" for="quick-native-date">관람 날짜<input id="quick-native-date" type="date" data-quick-native value="${state.date}" min="${today}"></label>
    <div class="quick-calendar-week" aria-hidden="true">${["일", "월", "화", "수", "목", "금", "토"].map(day => `<span>${day}</span>`).join("")}</div>
    <div class="quick-calendar-grid" role="group" aria-labelledby="quick-month">
        ${cells.map(date => {
            if (!date) return '<span class="quick-calendar-blank" aria-hidden="true"></span>';
            const count = programsForDate(PROGRAMS, date).length;
            return `<button type="button" data-quick-date="${date}" tabindex="${date === entryDate ? "0" : "-1"}"
                aria-label="${dateLabel(date)}${date === today ? ", 오늘" : ""}, ${count ? `${count}개 프로그램` : "등록된 일정 없음"}"
                aria-pressed="${date === state.date}" ${date === today ? 'aria-current="date"' : ""}
                class="quick-date${date === state.date ? " is-selected" : ""}${date === today ? " is-today" : ""}">
                <span>${Number(date.slice(-2))}</span>${count ? '<i aria-hidden="true"></i>' : ""}
            </button>`;
        }).join("")}
    </div>
    <p class="quick-calendar-key"><i aria-hidden="true"></i>프로그램이 있는 날</p>`;
}

function choicesMarkup(state, today) {
    const programs = programsForDate(PROGRAMS, state.date);
    const selected = programs.find(program => program.id === state.programId);
    return `<div class="quick-day-heading"><div><p>선택한 날짜</p><h3>${dateLabel(state.date)}</h3></div><span>${programs.length}개 프로그램</span></div>
        ${programs.length ? `<div class="quick-program-list" role="group" aria-label="프로그램 선택">
            ${programs.map(program => {
                const available = canSelectProgram(program) && state.date >= today;
                return `<button type="button" class="quick-program${selected?.id === program.id ? " is-selected" : ""}" data-quick-program="${esc(program.id)}"
                    aria-pressed="${selected?.id === program.id}" ${available ? "" : "disabled"}>
                    <img src="${esc(program.image)}" alt="" width="90" height="120" loading="lazy">
                    <span class="quick-program-copy"><span class="quick-program-category">${esc(program.category)} · ${available ? esc(program.status) : state.date < today ? "지난 일정" : esc(program.status)}</span>
                    <strong>${esc(program.title)}</strong><span>${esc(program.venue)}</span><span>${program.times.map(esc).join(" · ")}</span></span>
                    <span class="quick-program-check" aria-hidden="true">${selected?.id === program.id ? "✓" : "+"}</span>
                </button>`;
            }).join("")}
        </div>` : `<div class="quick-empty"><h4>등록된 프로그램이 없는 날이에요.</h4><p>달력에 점이 있는 날짜를 선택하거나 전체 일정을 살펴보세요.</p><a class="text-link" href="#/programs?view=calendar&month=${state.month}">전체 일정 보기 ${icon("arrow", 20)}</a></div>`}
        <div class="quick-selection-fields">
            <label for="quick-time">회차<select id="quick-time" data-quick-field="time" ${selected ? "" : "disabled"}>
                <option value="">${selected ? "회차를 선택하세요" : "프로그램을 먼저 선택하세요"}</option>
                ${(selected?.times || []).map(time => `<option value="${esc(time)}"${state.time === time ? " selected" : ""}>${esc(time)}</option>`).join("")}
            </select></label>
            <label for="quick-participants">인원<select id="quick-participants" data-quick-field="participants" ${selected ? "" : "disabled"}>
                ${[1, 2, 3, 4].map(count => `<option value="${count}"${state.participants === count ? " selected" : ""}>${count}명</option>`).join("")}
            </select></label>
        </div>
        <div class="quick-booking-action" data-quick-action>${actionMarkup(state)}</div>`;
}

function actionMarkup(state) {
    const destination = bookingDestination(state, PROGRAMS);
    const program = PROGRAMS.find(item => item.id === state.programId);
    const label = program?.category === "교육" ? "교육 신청으로" : program?.category === "전시" ? "전시 예매로" : "공연 예매로";
    return `<p>${destination ? `${esc(program.title)}<br>${esc(state.time)} · ${state.participants}명` : "프로그램과 회차를 선택해 주세요."}</p>
        ${destination ? `<a class="button button--dark" data-quick-submit href="#${esc(destination)}">${label} ${icon("arrow", 20)}</a>` : '<button class="button button--dark" type="button" disabled>예매·신청으로</button>'}`;
}

export function renderHomeBooking() {
    const state = createBookingState();
    return `<section class="home-booking container" id="quick-booking" aria-labelledby="quick-booking-heading">
        <div class="section-heading"><div><p class="home-section-label">날짜로 찾는 예술</p><h2 id="quick-booking-heading">언제 만나볼까요?</h2><p class="section-description">관람할 날을 고르면, 그날의 예술이 보여요.</p></div><a class="text-link" href="#/programs?view=calendar">전체 일정 ${icon("arrow", 20)}</a></div>
        <div class="quick-booking-layout">
            <div class="quick-calendar" data-quick-calendar>${calendarMarkup(state, seoulToday())}</div>
            <div class="quick-booking-choices" data-quick-choices>${choicesMarkup(state, seoulToday())}</div>
        </div>
        <p class="quick-booking-note">일정과 회차는 리뉴얼 체험용 예시입니다. 실제 예매·결제가 이루어지지 않습니다.</p>
        <p class="sr-only" data-quick-status role="status"></p>
    </section>`;
}

// [키보드와 선택 정리 / Keyboard navigation and selection cleanup]
// 달력은 하나의 탭 진입점과 방향키 이동을 제공하고 떠날 때 모든 리스너를 정리합니다.
// Provide one calendar tab stop, arrow navigation, and full listener cleanup on departure.
export function bindHomeBooking(root) {
    const section = root.querySelector("#quick-booking");
    if (!section) return () => {};
    const controller = new AbortController();
    let state = createBookingState();
    const calendar = section.querySelector("[data-quick-calendar]");
    const choices = section.querySelector("[data-quick-choices]");

    function update(change, focus = "") {
        const listScroll = change.type === "program" ? choices.querySelector(".quick-program-list")?.scrollTop || 0 : 0;
        state = changeBookingState(state, change, PROGRAMS);
        if (change.type === "month" || change.type === "date") calendar.innerHTML = calendarMarkup(state, seoulToday());
        if (change.type !== "month") {
            choices.innerHTML = choicesMarkup(state, seoulToday());
            const list = choices.querySelector(".quick-program-list");
            if (list) list.scrollTop = listScroll;
        }
        if (focus) section.querySelector(focus)?.focus({ preventScroll: true });
        section.querySelector("[data-quick-status]").textContent = change.type === "month"
            ? `${state.month.replace("-", "년 ")}월, 예매 날짜 선택은 유지됩니다.`
            : `${dateLabel(state.date)}, ${programsForDate(PROGRAMS, state.date).length}개 프로그램${state.programId ? ", 프로그램 선택됨" : ""}`;
    }

    section.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button || button.disabled) return;
        if (button.hasAttribute("data-quick-date")) update({ type: "date", value: button.dataset.quickDate }, `[data-quick-date="${button.dataset.quickDate}"]`);
        if (button.hasAttribute("data-quick-month")) update({ type: "month", value: moveMonth(state.month, Number(button.dataset.quickMonth)) }, `[data-quick-month="${button.dataset.quickMonth}"]`);
        if (button.hasAttribute("data-quick-today")) update({ type: "date", value: seoulToday() }, "[data-quick-today]");
        if (button.hasAttribute("data-quick-program")) update({ type: "program", value: button.dataset.quickProgram }, `[data-quick-program="${button.dataset.quickProgram}"]`);
    }, { signal: controller.signal });

    section.addEventListener("change", event => {
        if (event.target.hasAttribute("data-quick-native")) {
            update({ type: "date", value: event.target.validity.valid ? event.target.value : "" }, "[data-quick-native]");
            return;
        }
        const field = event.target.dataset.quickField;
        if (!field) return;
        state = changeBookingState(state, { type: field, value: event.target.value }, PROGRAMS);
        section.querySelector("[data-quick-action]").innerHTML = actionMarkup(state);
        section.querySelector("[data-quick-status]").textContent = bookingDestination(state, PROGRAMS)
            ? `${state.time}, ${state.participants}명 선택. 예매 또는 신청으로 이동할 수 있습니다.` : "회차를 선택해 주세요.";
    }, { signal: controller.signal });

    section.addEventListener("keydown", event => {
        const target = event.target.closest("[data-quick-date]");
        if (!target) return;
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        const date = new Date(`${target.dataset.quickDate}T12:00:00Z`);
        if (event.key in offsets) date.setUTCDate(date.getUTCDate() + offsets[event.key]);
        else if (event.key === "Home") date.setUTCDate(date.getUTCDate() - date.getUTCDay());
        else if (event.key === "End") date.setUTCDate(date.getUTCDate() + 6 - date.getUTCDay());
        else return;
        event.preventDefault();
        const next = date.toISOString().slice(0, 10);
        if (!next.startsWith(state.month)) {
            state = changeBookingState(state, { type: "month", value: next.slice(0, 7) }, PROGRAMS);
            calendar.innerHTML = calendarMarkup(state, seoulToday());
        }
        calendar.querySelectorAll("[data-quick-date]").forEach(button => { button.tabIndex = button.dataset.quickDate === next ? 0 : -1; });
        calendar.querySelector(`[data-quick-date="${next}"]`)?.focus({ preventScroll: true });
    }, { signal: controller.signal });

    section.addEventListener("click", event => {
        const link = event.target.closest("[data-quick-submit]");
        if (!link) return;
        const destination = bookingDestination(state, PROGRAMS);
        if (!destination) {
            event.preventDefault();
            section.querySelector("[data-quick-action]").innerHTML = actionMarkup(state);
            section.querySelector("[data-quick-status]").textContent = "일정이 변경되었습니다. 날짜와 프로그램을 다시 선택해 주세요.";
        } else link.setAttribute("href", `#${destination}`);
    }, { signal: controller.signal });

    return () => controller.abort();
}
