import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, expect as baseExpect } from "playwright/test";

// [실제 SDK와 모의 제공자로 검증 / Real SDK with a simulated auth provider]
// Google 동의를 대신하지 않고 요청·교환·복귀·오류·로그아웃의 앱 연결을 검사합니다.
// Verify app wiring without signing in to a real person's Google account.
const base = (process.argv[2]||"http://127.0.0.1:3000/v5/").replace(/\/?$/,"/");
const timeout = Number(process.env.BROWSER_TIMEOUT_MS) || 12000;
const expect = baseExpect.configure({ timeout });
const env = fs.readFileSync(".env.local","utf8");
const backend = env.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\r\n"']+)/m)?.[1];
if(!backend)throw new Error("Public Supabase URL is required for the SDK integration fixture");
const origin = new URL(base).origin;
const ref = new URL(backend).hostname.split(".")[0];
const catalogFixture = JSON.parse(fs.readFileSync("src/generated/catalog-snapshot.json", "utf8"));
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const context = await browser.newContext({viewport:{width:1440,height:1000}});
context.setDefaultTimeout(timeout);
const page = await context.newPage();
const directory=".lemonade/account-space";
fs.mkdirSync(directory,{recursive:true});
const results:{name:string;passed:boolean;error?:string}[]=[];
const errors:string[]=[];
const pendingRequests = new Set<string>();
page.on("request", request => pendingRequests.add(request.url()));
page.on("requestfinished", request => pendingRequests.delete(request.url()));
page.on("requestfailed", request => pendingRequests.delete(request.url()));
page.on("pageerror",error=>errors.push(error.message));
page.setDefaultTimeout(timeout);
let enabled=false;
let authorizeUrl="";
let exchanges=0;
const otpRequests: Record<string, unknown>[] = [];
let otpResponse: { status: number; body: Record<string, unknown> } = { status: 200, body: {} };
const id="123e4567-e89b-42d3-a456-426614174000";
let user={id,aud:"authenticated",role:"authenticated",email:"oauth-fixture@example.com",app_metadata:{provider:"google",providers:["google"]},user_metadata:{full_name:"OAuth 검증",name:"OAuth 검증",phone:""},identities:[],created_at:new Date().toISOString()};
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken=`${encode({alg:"HS256",typ:"JWT"})}.${encode({sub:id,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),iss:`${backend}/auth/v1`})}.fixture-signature`;
// No unmatched fixture request may reach the real authentication service.
await context.route(url => url.origin === backend, route => {
    errors.push(`Unexpected fixture endpoint: ${new URL(route.request().url()).pathname}`);
    return route.fulfill({ status: 500, json: { message: "Unexpected fixture endpoint" } });
});
await context.route(`${backend}/auth/v1/settings`,route=>route.fulfill({json:{external:{google:enabled}}}));
await context.route(url => url.origin === backend && url.pathname === "/auth/v1/otp", route => {
    otpRequests.push(route.request().postDataJSON());
    return route.fulfill({ status: otpResponse.status, json: otpResponse.body, headers: { "x-supabase-api-version": "2024-01-01" } });
});
await context.route(url=>url.origin===backend&&url.pathname==="/auth/v1/authorize",route=>{authorizeUrl=route.request().url();return route.fulfill({contentType:"text/html",body:"<!doctype html><html><body>Simulated OAuth authorization</body></html>"});});
await context.route(url=>url.origin===backend&&url.pathname==="/auth/v1/token",async route=>{
    exchanges++;
    const body=route.request().postDataJSON();
    assert.ok(body.code_verifier);
    await route.fulfill({json:{access_token:accessToken,token_type:"bearer",expires_in:3600,refresh_token:"fixture-refresh-token",user}});
});
await context.route(`${backend}/auth/v1/user`,async route=>{
    if(route.request().method()==="PUT"){
        const body=route.request().postDataJSON();
        user={...user,user_metadata:{...user.user_metadata,...body.data}};
    }
    await route.fulfill({json:user});
});
await context.route(url=>url.origin===backend&&url.pathname==="/auth/v1/logout",route=>route.fulfill({status:204}));
// [OAuth 검증도 실제 DB에 접근하지 않음 / OAuth fixtures never contact a real member DB]
let profileRow: Record<string, unknown> | null = null;
await context.route(url=>url.origin===backend&&url.pathname.startsWith("/rest/v1/"),async route=>{
    const table=new URL(route.request().url()).pathname.split("/").at(-1);
    if (new URL(route.request().url()).pathname === "/rest/v1/rpc/sejong_catalog_snapshot" && route.request().method() === "POST") return route.fulfill({ json: catalogFixture });
    if (new URL(route.request().url()).pathname === "/rest/v1/rpc/get_member_reservations" && route.request().method() === "POST") return route.fulfill({ json: [] });
    const single=route.request().headers().accept?.includes("application/vnd.pgrst.object+json");
    if(table==="sejong_profiles"){
        if(route.request().method()==="POST")profileRow=route.request().postDataJSON();
        return route.fulfill({json:single?profileRow:profileRow?[profileRow]:[]});
    }
    if(route.request().method()!=="GET")throw new Error(`Unexpected member write in OAuth fixture: ${table}`);
    return route.fulfill({json:single?null:[]});
});
async function check(name:string,run:()=>Promise<void>){try{await page.setViewportSize({width:1440,height:1000});await run();results.push({name,passed:true});console.log("PASS",name);}catch(error){results.push({name,passed:false,error:String(error)});console.error("FAIL",name,String(error),{url:page.url(),pending:[...pendingRequests].slice(0,5),runtimeErrors:errors});await page.screenshot({path:`${directory}/auth-failure-${results.length}.png`});}}
async function openLogin(target: typeof page = page) {
    const current = new URL(target.url());
    const route = current.pathname.replace(/\/$/, "");
    if (current.origin === origin && route.endsWith("/account/signup")) {
        await target.getByRole("link", { name: "로그인으로 돌아가기", exact: true }).click();
        await target.waitForURL(url => url.pathname.replace(/\/$/, "").endsWith("/account/login"));
    } else if (current.origin !== origin || !route.endsWith("/account/login")) {
        await target.goto(new URL("account/login/", base).href, { waitUntil: "domcontentloaded" });
    }
    // The provider effect confirms that React has hydrated the static form.
    await target.waitForFunction(() => {
        const status = document.getElementById("google-login-status");
        return Boolean(status?.textContent && !status.textContent.includes("Google 로그인 연결을 확인하고 있습니다."));
    });
}
let signedInState: Awaited<ReturnType<typeof context.storageState>>|undefined;
try{
    await check("both GNB account entries keep their labels and open login", async () => {
        for (const label of ["로그인", "회원가입"]) {
            await page.goto(new URL("account/", base).href, { waitUntil: "domcontentloaded" });
            const link = page.locator("#header").getByRole("link", { name: label, exact: true });
            await expect(link).toBeVisible();
            await link.click();
            await page.waitForURL(new URL("account/login/", base).href);
            await expect(page.locator('[data-account-auth="login"]')).toBeVisible();
        }
    });
    await check("existing email stays on login after the link request", async () => {
        await openLogin();
        await page.locator("#flow-email").fill("member@example.com");
        await page.locator('#flow-email').press("Enter");
        await expect(page.locator(".flow-info-box")).toContainText("이메일로 로그인 링크를 보냈습니다");
        assert.ok(new URL(page.url()).pathname.endsWith("/account/login/"));
        assert.equal(otpRequests.at(-1)?.create_user, false);
    });
    await check("delivery failures and disabled email auth never redirect to signup", async () => {
        for (const failure of [
            { status: 429, body: { error_code: "over_email_send_rate_limit", msg: "Too many requests" } },
            { status: 500, body: { error_code: "unexpected_failure", msg: "Delivery failed" } },
            { status: 422, body: { error_code: "otp_disabled", msg: "Email logins are disabled" } },
        ]) {
            otpResponse = failure;
            await openLogin();
            await page.locator("#flow-email").fill("member@example.com");
            await page.locator('#flow-email').press("Enter");
            await expect(page.locator('.ds-notice[role="alert"]')).toContainText("보내지 못했습니다");
            assert.ok(new URL(page.url()).pathname.endsWith("/account/login/"));
            await expect(page.locator("#flow-email")).toHaveValue("member@example.com");
        }
    });
    await check("unknown email continues to signup with the email and still requires name and consent", async () => {
        otpResponse = { status: 422, body: { error_code: "otp_disabled", msg: "Signups not allowed for otp" } };
        await page.emulateMedia({ reducedMotion: "reduce" });
        for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await openLogin();
            const before = otpRequests.length;
            await page.locator("#flow-email").fill("new+flow@example.com");
            await page.locator("#flow-email").press("Enter");
            await page.waitForURL(url => url.pathname.replace(/\/$/, "").endsWith("/account/signup"));
            await expect(page.locator("#flow-email")).toHaveValue("new+flow@example.com");
            await expect(page.locator("#flow-name")).toBeFocused();
            await expect(page.getByText("입력한 이메일로 회원가입을 이어갑니다.", { exact: false })).toBeVisible();
            assert.equal(otpRequests.length, before + 1);
            assert.equal(otpRequests.at(-1)?.create_user, false);
            const submit = page.locator('[data-account-auth="signup"] button[type="submit"]');
            await submit.click();
            await expect(page.locator('.ds-notice[role="alert"]')).toContainText("이름을 입력");
            await page.locator("#flow-name").fill("가입 확인");
            await submit.click();
            await expect(page.locator('.ds-notice[role="alert"]')).toContainText("동의해 주세요");
            assert.equal(otpRequests.length, before + 1);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px`);
            await page.screenshot({ path: `${directory}/signup-handoff-${width}.png`, fullPage: true });
        }
        otpResponse = { status: 200, body: {} };
        await page.locator('input[name="consent"]').check();
        await page.locator('[data-account-auth="signup"] button[type="submit"]').click();
        await expect(page.locator(".flow-info-box")).toContainText("이메일로 로그인 링크를 보냈습니다");
        assert.equal(otpRequests.at(-1)?.create_user, true);
        assert.equal(otpRequests.at(-1)?.email, "new+flow@example.com");
        assert.equal(await page.evaluate(() => localStorage.getItem("sejong-v4:session")), null);
        await expect(page.locator("#header").getByRole("link", { name: "로그인", exact: true })).toBeVisible();
        await page.emulateMedia({ reducedMotion: "no-preference" });
    });
    await check("provider availability controls the real Google button",async()=>{
        await openLogin();
        const google=page.getByRole("button",{name:/Google/});
        await page.waitForFunction(()=>[...document.querySelectorAll("button")].some(button=>button.textContent?.includes("Google")&&button.disabled));
        assert.ok(await google.isDisabled());
        enabled=true;
        await page.reload({waitUntil:"domcontentloaded"});
        await google.waitFor();
        await page.waitForFunction(()=>[...document.querySelectorAll("button")].some(button=>button.textContent?.includes("Google")&&!button.disabled));
        await google.click();
        await page.waitForURL(url=>url.origin===backend);
        const url=new URL(authorizeUrl);
        assert.equal(url.searchParams.get("provider"),"google");
        assert.equal(url.searchParams.get("redirect_to"),`${origin}/v5/account/callback/`);
        assert.equal(url.searchParams.get("code_challenge_method"),"s256");
        assert.ok(url.searchParams.get("code_challenge"));
    });
    await check("PKCE exchanges once and restores the real identity in page and header",async()=>{
        await page.goto(new URL("account/callback/?code=fixture-code",base).href,{waitUntil:"domcontentloaded"});
        await page.waitForURL(new URL("account/",base).href);
        await page.locator('.account-layout[aria-busy="false"]').waitFor();
        assert.equal(exchanges,1);
        assert.match(await page.locator(".account-identity h2").innerText(),/OAuth 검증/);
        assert.match(await page.locator(".account-identity").innerText(),/로그인됨/);
        await page.locator("#header").getByRole("link",{name:"마이페이지",exact:true}).waitFor();
        assert.equal(await page.locator("#header").getByRole("link",{name:"로그인",exact:true}).count(),0);
        assert.equal(new URL(page.url()).search,"");
        signedInState=await context.storageState();
        await page.reload({waitUntil:"domcontentloaded"});
        await page.locator('.account-layout[aria-busy="false"]').waitFor();
        assert.match(await page.locator(".account-identity h2").innerText(),/OAuth 검증/);
    });
    await check("authenticated profile updates use the member DB and keep the provider email read-only",async()=>{
        await page.getByRole("tab",{name:"회원정보",exact:true}).click();
        assert.ok(await page.locator("#account-profile-email").evaluate((element:HTMLInputElement)=>element.readOnly));
        await page.locator("#account-profile-name").fill("연결된 새 이름");
        await page.locator("#account-profile-phone").fill("010-0000-0000");
        await page.locator(".account-profile-form").getByRole("button",{name:/저장/}).click();
        await page.waitForFunction(()=>document.querySelector(".account-identity h2")?.textContent?.includes("연결된 새 이름"));
        assert.equal(profileRow?.phone,"010-0000-0000");
        assert.equal(user.user_metadata.phone,"");
    });
    await check("a failed new code cannot succeed through an older stored real session",async()=>{
        assert.ok(signedInState);
        const previous=await browser.newContext({storageState:signedInState});
        previous.setDefaultTimeout(timeout);
        const tab=await previous.newPage();
        await tab.addInitScript(({origin,key})=>{if(location.origin===origin)localStorage.setItem(key,JSON.stringify("fixture-old-code-verifier"));},{origin,key:`sb-${ref}-auth-token-code-verifier`});
        await previous.route(url=>url.origin===backend&&url.pathname==="/auth/v1/token",route=>route.fulfill({status:400,json:{error:"invalid_grant",error_code:"bad_code_verifier",error_description:"The authorization code is invalid"}}));
        try{
            await tab.goto(new URL("account/callback/?code=invalid-new-code",base).href,{waitUntil:"domcontentloaded"});
            await tab.locator('.ds-notice[role="alert"]').waitFor();
            assert.ok(new URL(tab.url()).pathname.endsWith("/account/callback/"), `Failed-code recovery landed on ${new URL(tab.url()).pathname}`);
        }finally{await previous.close();}
    });
    await check("a missing or corrupt PKCE verifier cannot reuse an older session",async()=>{
        assert.ok(signedInState);
        for (const code of ["missing-verifier", "corrupt-verifier", ""]) {
            const previous=await browser.newContext({storageState:signedInState});
            previous.setDefaultTimeout(timeout);
            const tab=await previous.newPage();
            await tab.addInitScript(({origin,key,corrupt})=>{if(location.origin===origin){if(corrupt)localStorage.setItem(key,"corrupt-verifier");else localStorage.removeItem(key);}},{origin,key:`sb-${ref}-auth-token-code-verifier`,corrupt:code==="corrupt-verifier"});
            await previous.route(url=>url.origin===backend&&url.pathname==="/auth/v1/token",route=>route.fulfill({status:400,json:{error:"invalid_grant",error_description:"Missing verifier"}}));
            try {
                await tab.goto(new URL(`account/callback/${code?`?code=${code}`:""}`,base).href,{waitUntil:"domcontentloaded"});
                await tab.locator('.ds-notice[role="alert"]').waitFor();
                assert.ok(new URL(tab.url()).pathname.endsWith("/account/callback/"));
            } finally {await previous.close();}
        }
    });
    await check("sign-out ends the SDK session and returns page and header to the guest state",async()=>{
        await page.locator(".account-identity").getByRole("button",{name:/로그아웃/}).click();
        await page.locator("#header").getByRole("link",{name:"로그인",exact:true}).waitFor();
        assert.match(await page.locator(".account-identity").innerText(),/방문자 공간/);
    });
    await check("denied or empty callbacks have a usable recovery path and never trust a next URL",async()=>{
        await page.goto(new URL("account/callback/?error=access_denied&next=https://example.com/",base).href,{waitUntil:"domcontentloaded"});
        await page.locator('.ds-notice[role="alert"]').waitFor();
        assert.match(await page.locator('.ds-notice[role="alert"]').innerText(),/취소/);
        const back=page.getByRole("link",{name:"로그인으로 돌아가기"});
        assert.equal(new URL((await back.getAttribute("href"))!,origin).pathname,"/v5/account/login/");
        assert.equal(new URL(page.url()).origin,origin);
    });
    await check("forged local sessions remain guests and login requires actual email verification",async()=>{
        const isolated=await browser.newContext();
        isolated.setDefaultTimeout(timeout);
        const tab=await isolated.newPage();
        await isolated.route(`${backend}/auth/v1/settings`,route=>route.fulfill({json:{external:{google:false}}}));
        await isolated.route(url=>url.origin===backend&&url.pathname.startsWith("/rest/v1/"),route=>{
            if (new URL(route.request().url()).pathname === "/rest/v1/rpc/sejong_catalog_snapshot" && route.request().method() === "POST") return route.fulfill({ json: catalogFixture });
            throw new Error("A forged local identity attempted to read private DB records");
        });
        await tab.addInitScript(()=>{
            localStorage.setItem("sejong-v4:profile",JSON.stringify({name:"신뢰할 수 없는 로컬 이름",email:"forged@example.com",phone:""}));
            localStorage.setItem("sejong-v4:session",'{"active":true}');
        });
        try {
            await tab.goto(new URL("account/",base).href,{waitUntil:"domcontentloaded"});
            await tab.locator('.account-layout[aria-busy="false"]').waitFor();
            await tab.locator("#header").getByRole("link",{name:"로그인",exact:true}).waitFor();
            assert.doesNotMatch(await tab.locator(".account-identity").innerText(),/신뢰할 수 없는 로컬 이름/);
            await tab.reload({waitUntil:"domcontentloaded"});
            await tab.locator('.account-layout[aria-busy="false"]').waitFor();
            await openLogin(tab);
            assert.equal(await tab.locator("#flow-name").count(),0);
            assert.equal(await tab.locator('[data-account-auth="login"] input[type="checkbox"]').count(),0);
            assert.equal(await tab.locator("#flow-email").inputValue(),"");
            await tab.getByRole("button",{name:"이메일로 로그인 링크 받기",exact:true}).click();
            await tab.locator('.ds-notice[role="alert"]').waitFor();
            assert.ok(new URL(tab.url()).pathname.endsWith("/account/login/"));
        } finally {await isolated.close();}
    });
    await check("no browser runtime errors",async()=>assert.deepEqual(errors,[]));
}finally{
    fs.writeFileSync(`${directory}/auth-report.json`,JSON.stringify({base,verifiedAt:new Date().toISOString(),mode:"real SDK with mocked provider; not Google consent verification",results,errors},null,2));
    await context.close();await browser.close();
}
if(results.some(result=>!result.passed))process.exitCode=1;
