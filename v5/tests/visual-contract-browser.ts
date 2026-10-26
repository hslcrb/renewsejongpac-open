import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { PAGES, PROGRAMS } from "../src/data/catalog.ts";
import { TEXT_VARIANTS } from "../src/data/design-tokens.ts";

type TextIssue = { code: string; element: string; text: string; fontSize?: number; variant?: string | null };
type Inspection = { textNodes: number; controls: number; placeholders: number; minimum: number | null; issues: TextIssue[] };
type RouteResult = { route: string; width: number; status?: number; inspection?: Inspection; errors: string[] };
type CheckResult = { name: string; width: number; passed: boolean; details?: unknown; error?: string };
type ContractReport = { base: string; verifiedAt: string; results: RouteResult[]; checks: CheckResult[] };

// [실제 전 경로와 팝업의 가독성 검증 / Verify readability on every live route and popup]
const base = (process.argv.slice(2).find(argument => !argument.startsWith("--")) || "http://127.0.0.1:3000/v5/").replace(/\/?$/, "/");
const evidence = path.resolve(".lemonade/visual-contract");
mkdirSync(evidence, { recursive: true });
const widths = [1440, 390];
const explicit = ["/", "/search", "/account", "/account/login", "/account/signup", "/account/recovery", "/account/callback", "/design-rules"];
const routes = [...new Set([...PAGES.map(page => page.path), ...PROGRAMS.map(program => `/booking/${program.id}`), ...explicit])].sort();
const selected = process.env.SEJONG_VISUAL_ROUTES?.split(",").filter(Boolean);
const reportFile = path.join(evidence, "report.json");
const previous = process.argv.includes("--recheck") && existsSync(reportFile)
    ? JSON.parse(readFileSync(reportFile, "utf8")) as ContractReport : undefined;
if (previous && previous.base !== base) throw new Error("Rechecks must target the same base URL as the original report.");
const historicalFailures = previous?.results.filter(result => result.errors.length || result.inspection?.issues.length) || [];
const testedRoutes = previous ? [...new Set(historicalFailures.map(result => result.route))]
    : selected?.length ? routes.filter(route => selected.includes(route)) : routes;
const browser = await chromium.launch();
const results: RouteResult[] = [];
const checks: CheckResult[] = [];

async function settle(page: Page) {
    await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
}

async function go(page: Page, route: string) {
    const url = new URL(route.replace(/^\/+/, ""), base);
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    const response = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (response?.status() !== 200) return response?.status();
    await page.locator("main").first().waitFor({ timeout: 20000 });
    await page.locator("#toast").waitFor({ state: "attached", timeout: 20000 });
    await settle(page);
    return response?.status();
}

// [범위의 실제 텍스트와 입력 표시값 검사 / Inspect actual text ranges and input display values]
async function inspectText(page: Page): Promise<Inspection> {
    return page.evaluate((variants) => {
        const issues: TextIssue[] = [];
        let textNodes = 0;
        let controls = 0;
        let placeholders = 0;
        let minimum = Infinity;
        const selector = (element: Element) => {
            if (element.id) return `#${element.id}`;
            const classes = Array.from(element.classList).slice(0, 3).map(value => `.${value}`).join("");
            return element.tagName.toLowerCase() + classes;
        };
        const visible = (element: Element, rectangles: DOMRect[]) => {
            if (!rectangles.some(box => box.width > 0 && box.height > 0)) return false;
            for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
                if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(ancestor.tagName) || ancestor.getAttribute("aria-hidden") === "true") return false;
                const style = getComputedStyle(ancestor);
                if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || Number(style.opacity) === 0) return false;
                const box = ancestor.getBoundingClientRect();
                const clippedX = /^(?:hidden|clip|scroll|auto)$/.test(style.overflowX);
                const clippedY = /^(?:hidden|clip|scroll|auto)$/.test(style.overflowY);
                if (box.width <= 1 && box.height <= 1 && (clippedX || clippedY || style.clipPath !== "none" || style.clip !== "auto")) return false;
                if ((clippedX || clippedY) && !rectangles.some(rectangle => (!clippedX || rectangle.right > box.left && rectangle.left < box.right)
                    && (!clippedY || rectangle.bottom > box.top && rectangle.top < box.bottom))) return false;
            }
            return true;
        };
        const inspect = (element: Element, text: string, fontSize: number, kind: string) => {
            const binding = element.closest("[data-text]");
            const variant = binding?.getAttribute("data-text");
            const entry = { element: selector(element), text: text.trim().slice(0, 100), fontSize, variant };
            if (Number.isFinite(fontSize)) minimum = Math.min(minimum, fontSize);
            if (!variant || !variants.includes(variant)) issues.push({ code: `${kind}-binding`, ...entry });
            if (!Number.isFinite(fontSize) || fontSize < 16 - 0.01) issues.push({ code: `${kind}-size`, ...entry });
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const text = node.textContent || "";
            const element = node.parentElement;
            if (!element || !text.trim()) continue;
            const svg = element.closest("svg");
            if (svg && !element.closest("text")) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            if (!visible(element, Array.from(range.getClientRects()))) continue;
            textNodes++;
            inspect(element, text, parseFloat(getComputedStyle(element).fontSize), "text");
        }
        for (const control of document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input:not([type=hidden]), select, textarea, button")) {
            if (!visible(control, Array.from(control.getClientRects()))) continue;
            controls++;
            inspect(control, control instanceof HTMLSelectElement ? control.selectedOptions[0]?.text || "" : control.value || control.getAttribute("aria-label") || control.textContent || "", parseFloat(getComputedStyle(control).fontSize), "control");
            if (control.matches("input[placeholder], textarea[placeholder]") && control.getAttribute("placeholder")) {
                placeholders++;
                inspect(control, control.getAttribute("placeholder")!, parseFloat(getComputedStyle(control, "::placeholder").fontSize), "placeholder");
            }
        }
        return { textNodes, controls, placeholders, minimum: minimum === Infinity ? null : minimum, issues };
    }, Object.keys(TEXT_VARIANTS));
}

async function check(page: Page, name: string, width: number, run: () => Promise<unknown>) {
    try {
        const details = await run();
        checks.push({ name, width, passed: true, details });
        console.log(`PASS ${width} ${name}`);
    } catch (error) {
        checks.push({ name, width, passed: false, error: String(error) });
        console.error(`FAIL ${width} ${name}: ${String(error)}`);
        await page.screenshot({ path: path.join(evidence, `failure-${name.replace(/\W+/g, "-")}-${width}.png`) }).catch(() => {});
    }
}

function requireCondition(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

try {
    // [뷰포트별 격리 컨텍스트와 전체 경로 / Isolated contexts and complete routes for each viewport]
    for (const width of widths) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce", timezoneId: "Asia/Seoul" });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        let activeErrors: string[] = [];
        page.on("pageerror", error => activeErrors.push(error.message));
        page.on("console", message => {
            if (message.type() === "error" && /hydration|uncaught|cannot.*contain|invalid.*prop/i.test(message.text())) activeErrors.push(message.text());
        });
        for (let index = 0; index < testedRoutes.length; index++) {
            const route = testedRoutes[index];
            activeErrors = [];
            const result: RouteResult = { route, width, errors: activeErrors };
            try {
                result.status = await go(page, route);
                if (result.status !== 200) result.errors.push(`HTTP ${result.status}`);
                else {
                    result.inspection = await inspectText(page);
                    if (!result.inspection.textNodes) result.errors.push("No visible text nodes were inspected.");
                }
            } catch (error) { result.errors.push(String(error)); }
            results.push(result);
            if (result.errors.length || result.inspection?.issues.length) console.error(`FAIL ${width} ${route}: ${result.errors.length} runtime/route error(s), ${result.inspection?.issues.length || 0} visual issue(s)`);
            if ((index + 1) % 20 === 0 || index === testedRoutes.length - 1) console.log(`AUDIT ${width}: ${index + 1}/${testedRoutes.length} routes`);
        }

        await check(page, "neutral palette and product surfaces", width, async () => {
            await go(page, "/booking/winter");
            const readMetrics = () => page.evaluate(() => {
                const resolveColor = (token: string) => {
                    const probe = document.createElement("span");
                    probe.style.color = `var(${token})`;
                    document.body.append(probe);
                    const color = getComputedStyle(probe).color;
                    probe.remove();
                    return color;
                };
                const root = getComputedStyle(document.documentElement);
                return {
                    colors: Object.fromEntries(["--color-white", "--color-black", "--surface-border", "--surface-border-subtle"].map(token => [token, resolveColor(token)])),
                    surfaces: Array.from(document.querySelectorAll('[data-component="surface"]')).map(element => {
                        const style = getComputedStyle(element);
                        return { tag: element.tagName, variant: element.getAttribute("data-surface-variant"), radiusName: element.getAttribute("data-surface-radius"), border: style.borderTopWidth, strokeColor: style.getPropertyValue("--surface-stroke-color").trim(), shadow: style.boxShadow, radius: style.borderTopLeftRadius, background: style.backgroundColor, expectedRadius: root.getPropertyValue(element.getAttribute("data-surface-radius") === "compact" ? "--surface-radius-compact" : "--surface-radius-panel").trim() };
                    }),
                };
            });
            const bookingMetrics = await readMetrics();
            requireCondition(bookingMetrics.surfaces.length >= 1, "Booking must render a registered surface for its active step.");
            await page.screenshot({ path: path.join(evidence, `booking-${width}.png`), fullPage: true });
            await go(page, "/account/signup");
            const formMetrics = await readMetrics();
            requireCondition(formMetrics.surfaces.some(surface => surface.tag === "FORM"), "Signup must use the registered semantic form surface.");
            const metrics = { colors: bookingMetrics.colors, surfaces: [...bookingMetrics.surfaces, ...formMetrics.surfaces] };
            requireCondition(metrics.colors["--color-white"] === "rgb(255, 254, 250)", `Warm paper color drifted: ${JSON.stringify(metrics.colors)}`);
            requireCondition(metrics.colors["--color-black"] === "rgb(33, 31, 28)", `Earth ink color drifted: ${JSON.stringify(metrics.colors)}`);
            for (const surface of metrics.surfaces) {
                requireCondition(parseFloat(surface.radius) >= 12, `Surface radius lost: ${JSON.stringify(surface)}`);
                requireCondition(surface.border === "0px" && surface.shadow.includes("inset") && surface.shadow.includes("0px 0px 0px 1px"), `Surface stroke must remain inside: ${JSON.stringify(surface)}`);
                requireCondition([metrics.colors["--surface-border"], metrics.colors["--surface-border-subtle"]].some(color => surface.shadow.includes(color)), `Surface stroke is not the gentle shared token: ${JSON.stringify(surface)}`);
                requireCondition(surface.background !== "rgb(255, 255, 255)" && surface.background !== "rgb(0, 0, 0)", `Surface uses a pure endpoint: ${JSON.stringify(surface)}`);
            }
            await page.screenshot({ path: path.join(evidence, `form-${width}.png`), fullPage: true });
            return metrics;
        });

        await check(page, "header search and whole menu text", width, async () => {
            await go(page, "/");
            await page.screenshot({ path: path.join(evidence, `home-${width}.png`), fullPage: true });
            await page.locator("#header").getByRole("button", { name: "통합검색 열기", exact: true }).click();
            await page.locator("#search-dialog").waitFor({ state: "visible" });
            await settle(page);
            const search = await inspectText(page);
            requireCondition(!search.issues.length, `Search text contract: ${JSON.stringify(search.issues)}`);
            await page.keyboard.press("Escape");
            await page.locator("#header").getByRole("button", { name: "전체 메뉴 열기", exact: true }).click();
            await page.locator("#menu-dialog").waitFor({ state: "visible" });
            await settle(page);
            const menu = await inspectText(page);
            requireCondition(!menu.issues.length, `Menu text contract: ${JSON.stringify(menu.issues)}`);
            await page.screenshot({ path: path.join(evidence, `menu-${width}.png`) });
            await page.keyboard.press("Escape");
            return { search, menu };
        });

        await check(page, "guide and black glass notification", width, async () => {
            await go(page, "/design-rules/#components/feedback");
            await settle(page);
            const guide = await inspectText(page);
            requireCondition(!guide.issues.length, `Guide text contract: ${JSON.stringify(guide.issues)}`);
            await page.screenshot({ path: path.join(evidence, `guide-${width}.png`), fullPage: true });
            await page.evaluate(() => window.dispatchEvent(new CustomEvent("sejong-toast", { detail: "관심 프로그램에 저장했어요. 읽기 쉬운 공통 알림입니다." })));
            await page.locator('#toast[aria-hidden="true"]').waitFor({ state: "detached" }).catch(() => {});
            await page.waitForFunction(() => {
                const toast = document.querySelector("#toast");
                return toast && getComputedStyle(toast).visibility === "visible" && Number(getComputedStyle(toast).opacity) > 0.99;
            });
            const toast = await page.locator("#toast").evaluate(element => {
                const style = getComputedStyle(element);
                const optics = element.querySelector(".liquid-glass-optics")!;
                const lens = getComputedStyle(optics);
                const rect = element.getBoundingClientRect();
                return { variant: element.getAttribute("data-glass-variant"), radius: parseFloat(style.borderRadius), color: style.color, background: lens.backgroundColor, filter: lens.backdropFilter, pointerEvents: style.pointerEvents, fontSize: parseFloat(style.fontSize), inside: rect.x >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight };
            });
            requireCondition(toast.variant === "black" && toast.radius > 999 && toast.fontSize >= 16 && toast.inside, `Black glass geometry: ${JSON.stringify(toast)}`);
            requireCondition(toast.pointerEvents === "none" && toast.color === "rgb(255, 254, 250)", `Black glass semantics: ${JSON.stringify(toast)}`);
            requireCondition(toast.filter !== "none" && toast.background !== "rgb(0, 0, 0)", `Black glass optics: ${JSON.stringify(toast)}`);
            const notificationText = await inspectText(page);
            requireCondition(!notificationText.issues.length, `Notification text contract: ${JSON.stringify(notificationText.issues)}`);
            await page.screenshot({ path: path.join(evidence, `guide-toast-${width}.png`) });
            return { guide, toast, notificationText };
        });

        await check(page, "footer and context popup text", width, async () => {
            await go(page, "/");
            await page.locator("#footer").scrollIntoViewIfNeeded();
            await settle(page);
            const footer = await inspectText(page);
            requireCondition(!footer.issues.length, `Footer text contract: ${JSON.stringify(footer.issues)}`);
            requireCondition(await page.locator("#footer").isVisible(), "The actual footer must be visible during inspection.");
            await page.locator("#footer").dispatchEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 400 });
            await page.getByRole("menu", { name: "페이지 바로가기 메뉴" }).waitFor({ state: "visible" });
            await settle(page);
            const popup = await inspectText(page);
            requireCondition(!popup.issues.length, `Context popup text contract: ${JSON.stringify(popup.issues)}`);
            await page.screenshot({ path: path.join(evidence, `footer-context-menu-${width}.png`) });
            await page.keyboard.press("Escape");
            return { footer, popup };
        });
        await context.close();
    }
} finally {
    // [최초 실패를 보존하고 수정된 경로만 교체 / Preserve initial failures and replace only reverified routes]
    const finalResults = previous ? [...previous.results.filter(old => !results.some(result => result.route === old.route && result.width === old.width)), ...results] : results;
    const finalChecks = previous ? [...previous.checks.filter(old => !checks.some(check => check.name === old.name && check.width === old.width)), ...checks] : checks;
    const failures = finalResults.filter(result => result.errors.length || result.inspection?.issues.length);
    const summary = { routes: new Set(finalResults.map(result => result.route)).size, viewports: widths, routeChecks: finalResults.length, failedRoutes: failures.length, interactionChecks: finalChecks.length, failedInteractions: finalChecks.filter(check => !check.passed).length, inspectedTextNodes: finalResults.reduce((sum, result) => sum + (result.inspection?.textNodes || 0), 0), inspectedControls: finalResults.reduce((sum, result) => sum + (result.inspection?.controls || 0), 0) };
    if (previous) writeFileSync(path.join(evidence, "report-initial.json"), JSON.stringify(previous, null, 2));
    writeFileSync(reportFile, JSON.stringify({ base, verifiedAt: new Date().toISOString(), isolatedBrowser: true, summary, ...(previous ? { recheck: { routes: testedRoutes, originalVerifiedAt: previous.verifiedAt, historicalFailures } } : {}), results: finalResults, checks: finalChecks }, null, 2));
    console.log(JSON.stringify(summary));
    if (failures.length || finalChecks.some(check => !check.passed)) process.exitCode = 1;
    await browser.close();
}
