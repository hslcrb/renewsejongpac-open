import test from "node:test";
import assert from "node:assert/strict";
import {
    seoulToday, monthDates, moveMonth, programsForDate,
    createBookingState, changeBookingState, bookingDestination, discoverPrograms,
} from "../src/features/home-domain.ts";

const programs = [
    { id: "opera", title: "오페라", category: "공연", start: "2026-10-15", end: "2026-10-18", times: ["14:00", "19:30"], status: "예매중" },
    { id: "gallery", title: "빛 전시", category: "전시", start: "2026-10-01", end: "2026-11-15", times: ["10:00"], status: "예매중" },
    { id: "class", title: "미술 수업", category: "교육", start: "2026-10-20", end: "2026-10-21", times: ["18:00"], status: "접수중" },
    { id: "sold", title: "매진 공연", category: "공연", start: "2026-10-16", end: "2026-10-16", times: ["14:00"], status: "매진" },
    { id: "dance", title: "시즌 무용", category: "공연", start: "2026-10-20", end: "2026-10-25", times: ["19:30"], status: "예매중" },
];

test("서울의 자정 경계가 UTC 날짜를 그대로 사용하지 않는다", () => {
    assert.equal(seoulToday(new Date("2026-10-15T15:01:00Z")), "2026-10-16");
    assert.equal(seoulToday(new Date("2026-10-15T14:59:00Z")), "2026-10-15");
});

test("달력은 윤년과 월 경계를 실제 날짜로 만든다", () => {
    assert.equal(monthDates("2024-02").filter(Boolean).length, 29);
    assert.equal(monthDates("2026-02").filter(Boolean).length, 28);
    assert.equal(monthDates("2026-02")[0], "2026-02-01");
    assert.equal(moveMonth("2026-01", 1), "2026-02");
    assert.equal(moveMonth("2026-12", 1), "2027-01");
    assert.deepEqual(monthDates("2026-13"), []);
});

test("해당 날짜의 프로그램을 조회하되 존재하지 않는 날짜는 거부한다", () => {
    assert.deepEqual(programsForDate(programs, "2026-10-16").map(item => item.id), ["opera", "gallery", "sold"]);
    assert.deepEqual(programsForDate(programs, "2026-02-30"), []);
});

test("날짜를 바꾸면 프로그램·회차·인원을 초기화하고 월만 넘길 때는 선택을 유지한다", () => {
    const selected = { ...createBookingState("2026-10-16"), programId: "opera", time: "19:30", participants: 4 };
    assert.deepEqual(changeBookingState(selected, { type: "date", value: "2026-10-20" }, programs), {
        month: "2026-10", date: "2026-10-20", programId: "", time: "", participants: 1,
    });
    const navigated = changeBookingState(selected, { type: "month", value: "2026-11" }, programs);
    assert.equal(navigated.date, "2026-10-16");
    assert.equal(navigated.time, "19:30");
});

test("프로그램을 바꾸면 이전 회차와 인원을 새 프로그램으로 넘기지 않는다", () => {
    const selected = { ...createBookingState("2026-10-16"), programId: "opera", time: "19:30", participants: 4 };
    const changed = changeBookingState(selected, { type: "program", value: "gallery" }, programs);
    assert.equal(changed.programId, "gallery");
    assert.equal(changed.time, "");
    assert.equal(changed.participants, 1);
    assert.equal(changeBookingState(selected, { type: "program", value: "class" }, programs).programId, "");
});

test("날짜 입력을 비우면 이전 선택으로 예매를 계속할 수 없다", () => {
    const selected = { ...createBookingState("2026-10-16"), programId: "opera", time: "19:30", participants: 2 };
    const cleared = changeBookingState(selected, { type: "date", value: "" }, programs);
    assert.equal(cleared.date, "");
    assert.equal(cleared.programId, "");
    assert.equal(bookingDestination(cleared, programs, "2026-10-16"), "");
});

test("회차·일정·상태·인원이 유효해야 예매 주소를 만든다", () => {
    const valid = { ...createBookingState("2026-10-16"), programId: "opera", time: "19:30", participants: 2 };
    assert.equal(bookingDestination(valid, programs, "2026-10-16"), "/booking/opera?date=2026-10-16&time=19%3A30&participants=2&source=home");
    for (const patch of [{ time: "" }, { time: "24:00" }, { participants: 0 }, { participants: 1.5 }, { participants: 5 }, { date: "2026-10-19" }, { programId: "sold", time: "14:00" }]) {
        assert.equal(bookingDestination({ ...valid, ...patch }, programs, "2026-10-16"), "");
    }
    assert.equal(bookingDestination(valid, programs, "2026-10-17"), "");
});

test("교육은 선택 날짜·회차·인원을 공통 예매 경로에 보존한다", () => {
    const selected = { ...createBookingState("2026-10-20"), programId: "class", time: "18:00", participants: 3 };
    assert.equal(bookingDestination(selected, programs, "2026-10-16"), "/booking/class?date=2026-10-20&time=18%3A00&participants=3&source=home");
    assert.equal(bookingDestination({ ...selected, programId: "gallery", time: "10:00" }, programs, "2026-10-16"), "/booking/gallery?date=2026-10-20&time=10%3A00&participants=3&source=home");
});

test("탐색은 오늘 프로그램 다음 가까운 일정을 보여주고 지난 일정은 제외한다", () => {
    assert.deepEqual(discoverPrograms(programs, "공연", "2026-10-16").map(item => item.id), ["opera", "sold", "dance"]);
    assert.deepEqual(discoverPrograms(programs, "기획·시즌", "2026-10-16").map(item => item.id), ["dance"]);
    assert.deepEqual(discoverPrograms(programs, "전체", "2026-12-01"), []);
});
