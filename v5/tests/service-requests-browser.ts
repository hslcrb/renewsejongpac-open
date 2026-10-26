import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "playwright/test";
import type { Route } from "playwright";
import type { ServiceRequest } from "../src/page-completion/requests.ts";
import { VERIFIED_GOODS } from "../src/page-completion/content/news.ts";

// [실제 SDK의 실패·재시도·계정 전환 / Real SDK error, retry and account-switch integration]
// HTTP 대역으로 실제 개인정보·메일을 만들지 않습니다. RLS·SQL은 별도 DB 검사로 검증합니다.
// HTTP fixtures do not prove live RLS; the separate SQL suite verifies database boundaries.
const base = (process.argv[2] || "http://127.0.0.1:4174/v5/").replace(/\/?$/, "/");
const backend = fs.readFileSync(".env.local", "utf8").match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\r\n"']+)/m)?.[1];
assert.ok(backend);
const origin = new URL(base).origin;
const storageKey = `sb-${new URL(backend).hostname.split(".")[0]}-auth-token`;
const directory = ".lemonade/site-completion";
fs.mkdirSync(directory, { recursive: true });
const snapshot = JSON.parse(fs.readFileSync("src/generated/catalog-snapshot.json", "utf8"));
const ownerA = "11111111-2222-4333-8444-555555555555";
const ownerB = "11111111-2222-4333-8444-666666666666";
const users = Object.fromEntries([ownerA, ownerB].map((id, i) => [id, { id, aud: "authenticated", role: "authenticated", email: `request-${i}@example.test`, app_metadata: { provider: "google" }, user_metadata: { full_name: i ? "두 번째 회원" : "첫 번째 회원", phone: "010-1234-5678" }, created_at: new Date().toISOString() }]));
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
function session(id: string) {
    const now = Math.floor(Date.now() / 1000);
    return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now })}.fixture`, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: `fixture-${id}`, user: users[id] };
}
const goods = VERIFIED_GOODS.map(good => ({ id: good.id, title: good.title, description: good.description, source_url: good.sourceUrl, price: good.price ?? null, image: good.image ?? null }));
const rows: (ServiceRequest & { owner: string; requestKey: string })[] = [];
const carts = new Map<string, Map<string, number>>();
const calls: { name: string; owner: string; body: Record<string, unknown> }[] = [];
let failSubmit = false;
let lateGate: { wait: Promise<void>; release: () => void } | null = null;
const errors: string[] = [];
const results: { name: string; passed: boolean; error?: string }[] = [];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: storageKey, value: JSON.stringify(session(ownerA)) }] }] } });
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on("pageerror", error => errors.push(error.message));
function requestOwner(route: Route): string {
    try { return JSON.parse(Buffer.from((route.request().headers().authorization || "").split(" ")[1].split(".")[1], "base64url").toString()).sub || ""; }
    catch { return ""; }
}
await context.route(url => url.origin === new URL(backend).origin, async route => {
    const request = route.request(), url = new URL(request.url()), owner = requestOwner(route);
    const name = url.pathname.replace("/rest/v1/", "");
    const body = request.method() === "POST" ? request.postDataJSON() || {} : {};
    calls.push({ name, owner, body });
    if (url.pathname === "/auth/v1/user") return route.fulfill({ json: users[owner] });
    if (url.pathname === "/auth/v1/settings") return route.fulfill({ json: { external: { google: true } } });
    if (name === "rpc/sejong_catalog_snapshot") return route.fulfill({ json: snapshot });
    if (name === "sejong_service_goods") return route.fulfill({ json: goods });
    if (name === "sejong_service_cart") return route.fulfill({ json: [...(carts.get(owner) || [])].map(([good_id, quantity]) => ({ good_id, quantity, sejong_service_goods: goods.find(good => good.id === good_id) })) });
    if (name === "sejong_service_requests") return route.fulfill({ json: rows.filter(row => row.owner === owner && (!url.searchParams.has("form_id") || `eq.${row.form_id}` === url.searchParams.get("form_id"))) });
    if (name === "rpc/set_sejong_cart_quantity") {
        const cart = carts.get(owner) || new Map<string, number>();
        const quantity = Number(body.p_quantity) + (body.p_increment ? cart.get(body.p_good_id) || 0 : 0);
        quantity ? cart.set(body.p_good_id, quantity) : cart.delete(body.p_good_id);
        carts.set(owner, cart);
        return route.fulfill({ contentType: "application/json", body: "null" });
    }
    if (name === "rpc/submit_sejong_request") {
        const capturedGate = lateGate;
        if (capturedGate) { lateGate = null; await capturedGate.wait; }
        const existing = rows.find(row => row.owner === owner && row.requestKey === body.p_request_key);
        if (existing) return route.fulfill({ json: existing });
        const formId = String(body.p_form_id);
        const definition = snapshot.pages.find((item: { path: string }) => item.path === formId)?.completion?.form;
        assert.ok(definition, "Submitted form exists in the actual catalog");
        const values = { ...body.p_values };
        if (definition.kind === "order") {
            assert.ok(!("total" in values) && !("items" in values), "Browser never supplies a trusted price or item list");
            values.items = [...(carts.get(owner) || [])].map(([id, quantity]) => ({ id, title: goods.find(good => good.id === id)!.title, quantity, unitPrice: goods.find(good => good.id === id)!.price }));
            values.total = values.items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
            values.paymentStatus = "unpaid";
            carts.set(owner, new Map());
        }
        const row = { id: randomUUID(), reference: `SJ-TEST-${rows.length + 1}`, form_id: formId, kind: definition.kind, status: "submitted" as const, values, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 90 * 86400000).toISOString(), owner, requestKey: String(body.p_request_key) };
        rows.push(row);
        if (failSubmit) { failSubmit = false; return route.fulfill({ status: 503, json: { message: "일시적인 연결 오류입니다." } }); }
        return route.fulfill({ json: row });
    }
    if (name === "rpc/cancel_sejong_request") {
        const row = rows.find(item => item.owner === owner && item.id === body.p_id);
        assert.ok(row); row.status = "cancelled";
        return route.fulfill({ json: row });
    }
    if (name === "sejong_profiles") return route.fulfill({ json: null });
    if (name.startsWith("sejong_") && request.method() === "GET") return route.fulfill({ json: [] });
    errors.push(`Unexpected endpoint ${request.method()} ${url.pathname}`);
    return route.fulfill({ status: 500, json: { message: "Unexpected test endpoint" } });
});
const go = (path: string) => page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
const form = () => page.locator(".service-request-form");
async function check(name: string, run: () => Promise<void>) {
    try { await run(); results.push({ name, passed: true }); console.log("PASS", name); }
    catch (error) { results.push({ name, passed: false, error: String(error) }); console.error("FAIL", name, String(error)); await page.screenshot({ path: `${directory}/request-failure-${results.length}.png` }); }
}
async function switchOwner(owner: string) {
    await page.evaluate(({ key, next }) => {
        localStorage.setItem(key, JSON.stringify(next));
        const channel = new BroadcastChannel(key);
        channel.postMessage({ event: "SIGNED_IN", session: next }); channel.close();
    }, { key: storageKey, next: session(owner) });
    await expect(form().locator('input[name="name"]')).toHaveValue(owner === ownerA ? "첫 번째 회원" : "두 번째 회원");
}
async function enterInquiry(subject: string) {
    await expect(form().locator('input[name="name"]')).toBeVisible();
    await form().locator('input[name="subject"]').fill(subject);
    await form().locator('textarea[name="message"]').fill("공연장 이용에 관해 문의합니다.");
    await form().getByRole("checkbox").check();
}
try {
    await check("failed response stays retryable with the same key and one saved request", async () => {
        await go("visit/support/inquiry/"); await enterInquiry("재시도 확인");
        failSubmit = true;
        await form().getByRole("button", { name: "신청 내용 저장" }).click();
        await expect(form()).toContainText("일시적인 연결 오류입니다.");
        await expect(form()).not.toContainText("접수번호 SJ-TEST");
        await form().getByRole("button", { name: "신청 내용 저장" }).click();
        await expect(form()).toContainText("접수번호 SJ-TEST-1");
        assert.equal(rows.length, 1);
        const attempts = calls.filter(call => call.name === "rpc/submit_sejong_request");
        assert.equal(attempts[0].body.p_request_key, attempts[1].body.p_request_key);
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".service-request-history")).toContainText("SJ-TEST-1");
        await page.locator(".service-request-history summary").first().click();
        await page.getByRole("button", { name: "신청 취소", exact: true }).click();
        await expect(page.locator(".service-request-history summary").first()).toContainText("취소");
    });
    await check("a late save from the previous account never appears in the new account", async () => {
        await enterInquiry("계정 전환 중 저장");
        let release!: () => void;
        lateGate = { wait: new Promise<void>(resolve => { release = resolve; }), release: () => release() };
        const held = lateGate;
        const sent = page.waitForRequest(request => request.url().endsWith("/rpc/submit_sejong_request"));
        await form().getByRole("button", { name: "신청 내용 저장" }).click(); await sent;
        await switchOwner(ownerB);
        held.release();
        await expect.poll(() => rows.length).toBe(2);
        await expect(page.locator(".service-request")).not.toContainText("SJ-TEST-2");
        await expect(page.locator(".service-request-history")).toContainText("저장한 신청 내역이 없습니다.");
        assert.equal(rows[1].owner, ownerA);
    });
    await check("adding twice increments the owner cart and checkout retains its receipt", async () => {
        await go("news/goods/");
        const add = page.getByRole("button", { name: "장바구니 담기", exact: true }).first();
        await add.click(); await expect(add).toBeEnabled();
        await add.click(); await expect(add).toBeEnabled();
        assert.equal(carts.get(ownerB)?.get(goods[0].id), 2);
        await go("news/goods/cart/");
        const quantity = page.locator(".service-cart-line select").first();
        await expect(quantity).toHaveValue("2"); await quantity.selectOption("3"); await expect(quantity).toBeEnabled();
        await expect(page.locator(".service-cart-total")).toContainText(((goods[0].price || 0) * 3).toLocaleString("ko-KR"));
        await form().getByRole("checkbox").check();
        await form().getByRole("button", { name: "구매 요청 저장" }).click();
        await expect(page.locator(".service-goods")).toContainText("접수번호 SJ-TEST-3");
        await expect(page.locator(".service-goods")).toContainText("장바구니가 비어 있습니다");
        assert.equal(rows[2].values.total, (goods[0].price || 0) * 3);
        assert.equal(rows[2].values.paymentStatus, "unpaid");
        await go("news/goods/orders/");
        const disclosure = page.locator(".service-goods summary").first();
        await expect(disclosure).toContainText("SJ-TEST-3"); await disclosure.click();
        await expect(page.locator(".service-goods")).toContainText(`${goods[0].title} × 3`);
        await page.getByRole("button", { name: "구매 요청 취소" }).click();
        await expect(disclosure).toContainText("취소");
    });
    await check("closed event applications do not expose an active submission form", async () => {
        await go("news/events/review/apply/");
        await expect(page.locator(".service-request")).toContainText("신청 접수 안내");
        assert.equal(await form().count(), 0);
    });
    await check("comparison venue selection survives the rental handoff and invalid date ranges cannot submit", async () => {
        await go("rental/apply/?venue=m-theater");
        await expect(form().locator('select[name="venue"]')).toHaveValue("m-theater");
        await form().locator('input[name="organization"]').fill("공연 단체");
        await form().locator('input[name="date"]').fill("2027-04-02");
        await form().locator('input[name="endDate"]').fill("2027-04-01");
        await form().locator('input[name="attendees"]').fill("200");
        await form().locator('input[name="subject"]').fill("정기 공연");
        await form().locator('textarea[name="message"]').fill("무대와 설치 일정을 문의합니다.");
        await form().getByRole("checkbox").check();
        const before = calls.filter(call => call.name === "rpc/submit_sejong_request").length;
        await form().getByRole("button", { name: "신청 내용 저장" }).click();
        await expect(form()).toContainText("종료일은 시작일 이후로 선택해 주세요.");
        assert.equal(calls.filter(call => call.name === "rpc/submit_sejong_request").length, before);
        await form().locator('input[name="endDate"]').fill("2027-04-03");
        await form().getByRole("button", { name: "신청 내용 저장" }).click();
        await expect(form()).toContainText("접수번호 SJ-TEST-4");
        assert.equal(rows.at(-1)?.values.venue, "m-theater");
    });
    assert.deepEqual(errors, []);
} finally {
    fs.writeFileSync(`${directory}/service-browser.json`, JSON.stringify({ base, mode: "real SDK with Auth/PostgREST HTTP fixtures; live SQL boundaries verified separately", results, errors, rpcCalls: calls.filter(call => call.name.startsWith("rpc/") && call.name !== "rpc/sejong_catalog_snapshot").map(call => ({ name: call.name, owner: call.owner })), savedRows: rows.length }, null, 2));
    await browser.close();
}
if (results.some(result => !result.passed)) process.exitCode = 1;
