import test from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";

// [실제 SDK와 모의 이메일 응답 / Real SDK with simulated email responses]
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://email-fixture.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_email_fixture";
const auth = await import("../src/lib/supabase.ts");

function emailResponse(t: TestContext, status: number, body: Record<string, unknown>) {
    const requests: { url: URL; body: Record<string, unknown> }[] = [];
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { origin: "https://app.example.com" } } });
    t.after(() => {
        if (previous) Object.defineProperty(globalThis, "window", previous);
        else Reflect.deleteProperty(globalThis, "window");
    });
    t.mock.method(globalThis, "fetch", async (input: string | URL | Request, options?: RequestInit) => {
        const url = new URL(String(input));
        assert.equal(url.origin, "https://email-fixture.supabase.co");
        assert.equal(url.pathname, "/auth/v1/otp");
        requests.push({ url, body: JSON.parse(String(options?.body)) });
        return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-supabase-api-version": "2024-01-01" } });
    });
    return requests;
}

test("an unregistered email requests signup without creating an account or sending a second request", async t => {
    const requests = emailResponse(t, 422, { code: "otp_disabled", message: "Signups not allowed for otp" });
    await assert.rejects(auth.requestEmailSignIn(" new@example.com ", { createUser: false }), { name: "EmailSignupRequiredError" });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.email, "new@example.com");
    assert.equal(requests[0].body.create_user, false);
});

for (const failure of [
    { status: 429, code: "over_email_send_rate_limit", message: "Too many requests" },
    { status: 500, code: "unexpected_failure", message: "Email delivery failed" },
    { status: 422, code: "otp_disabled", message: "Email logins are disabled" },
    { status: 422, code: "signup_disabled", message: "Signups not allowed for this instance" },
]) {
    test(`${failure.code}: ${failure.message} remains a send error`, async t => {
        emailResponse(t, failure.status, { code: failure.code, message: failure.message });
        await assert.rejects(auth.requestEmailSignIn("visitor@example.com", { createUser: false }), error => {
            assert.ok(error instanceof Error);
            assert.notEqual(error.name, "EmailSignupRequiredError");
            assert.match(error.message, /로그인 링크를 보내지 못했습니다/);
            return true;
        });
    });
}

test("an existing account receives a login link without enabling signup", async t => {
    const requests = emailResponse(t, 200, {});
    await auth.requestEmailSignIn(" member@example.com ", { createUser: false });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.create_user, false);
    assert.equal(requests[0].url.searchParams.get("redirect_to"), "https://app.example.com/v5/account/callback/");
    assert.ok(requests[0].body.code_challenge);
    assert.equal((await auth.supabase!.auth.getSession()).data.session, null);
});

test("signup explicitly allows account creation with the supplied profile", async t => {
    const requests = emailResponse(t, 200, {});
    await auth.requestEmailSignIn("new@example.com", { createUser: true, name: " 새 회원 ", phone: " 010-1111-2222 " });
    assert.equal(requests[0].body.create_user, true);
    assert.deepEqual(requests[0].body.data, { name: "새 회원", full_name: "새 회원", phone: "010-1111-2222" });
    assert.equal((await auth.supabase!.auth.getSession()).data.session, null);
});

test("a disabled signup request cannot be mistaken for the login handoff", async t => {
    emailResponse(t, 422, { code: "otp_disabled", message: "Signups not allowed for otp" });
    await assert.rejects(auth.requestEmailSignIn("new@example.com", { createUser: true }), { name: "Error" });
});
