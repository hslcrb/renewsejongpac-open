import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { PAGES } from "../src/data/catalog.js";

// [사용자 경로와 상호작용 계약 / Visitor routes and interaction contracts]
// 렌더 결과와 선택 후의 실제 화면 값을 검사하며 CSS 구현을 복제하지 않습니다.
// Assert rendered destinations and committed UI values rather than CSS implementation.
async function loadStory() {
    const module = await import("../src/features/story.js").catch(error => {
        if (error.code === "ERR_MODULE_NOT_FOUND") return null;
        throw error;
    });
    assert.ok(module, "The About story renderer and interaction are not implemented");
    return module;
}

test("About owns only the two introduction routes and preserves every institutional destination", async () => {
    const { renderStory } = await loadStory();
    const required = [
        "/about/introduction/greeting", "/about/introduction/history",
        "/about/introduction/organization", "/about/companies", "/about/introduction/ci",
        "/about/esg", "/about/disclosure", "/about/partners", "/about/donation",
    ];
    for (const path of ["/about", "/about/introduction"]) {
        const html = renderStory(path);
        assert.equal((html.match(/<h1\b/g) || []).length, 1, "One page title");
        for (const destination of required) assert.ok(html.includes(`href="#${destination}"`), destination);
        assert.match(html, /천 天/);
        assert.match(html, /지 地/);
        assert.match(html, /인 人/);
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length, "IDs are unique");
        for (const [, target] of html.matchAll(/href="#(\/[^"?]*)/g)) {
            assert.ok(PAGES.some(page => page.path === target), `Registered destination: ${target}`);
        }
    }
    for (const path of ["/", "/about/esg", "/about/introduction/history", "/about/introduction/"]) {
        assert.equal(renderStory(path), null, path);
    }
});

test("About supplies local media and space choices without concealing its first readable frame", async () => {
    const { renderStory } = await loadStory();
    const html = renderStory("/about");
    const images = [...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)];
    assert.ok(images.length >= 3);
    for (const [tag, source] of images) {
        await access(new URL("../" + source, import.meta.url));
        assert.match(tag, /alt="[^"]+"/);
    }
    assert.match(html, /sejong-grand-facade\.png/);
    assert.equal((html.match(/type="radio"/g) || []).length, 5);
    assert.equal((html.match(/\schecked(?:\s|>)/g) || []).length, 1);
    assert.ok(!html.includes('style="opacity: 0'));
    assert.ok(!html.includes("undefined"));
});

// [브라우저 경계의 작은 대역 / Small DOM boundary substitute]
// Node에는 DOM이 없으므로 이벤트와 요소 값을 제공하고 실제 binder를 실행합니다.
// Node has no DOM; provide event targets and element values while executing the real binder.
class TestElement extends EventTarget {
    constructor(dataset = {}) {
        super();
        this.dataset = dataset;
        this.attributes = new Map();
        this.style = {
            setProperty: (name, value) => this.attributes.set(name, value),
            removeProperty: name => this.attributes.delete(name),
        };
        this.classList = { add() {}, remove() {}, toggle() {} };
        this.isConnected = false;
        this.textContent = "";
        this.innerHTML = "";
        this.checked = false;
    }

    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    getBoundingClientRect() { return { top: 400, bottom: 1000, height: 600, width: 1200 }; }
    contains(element) { return element === this || Boolean(element?.dataset?.storySpace); }
    closest(selector) { return selector === "[data-story-space]" && this.dataset.storySpace ? this : null; }
}

function fixture(reduced = false) {
    const preference = new EventTarget();
    preference.matches = reduced;
    const view = new EventTarget();
    const frames = new Map();
    let frameId = 0;
    Object.assign(view, {
        innerHeight: 900,
        innerWidth: 1440,
        matchMedia: () => preference,
        requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
        cancelAnimationFrame: id => frames.delete(id),
        AbortController,
    });
    const document = new EventTarget();
    document.defaultView = view;
    document.hidden = false;
    const story = new TestElement();
    const panel = new TestElement();
    const media = new TestElement();
    const status = new TestElement();
    const choice = new TestElement({ storySpace: "s-theater" });
    const selectors = new Map([
        ["[data-story]", story], ["[data-story-space-panel]", panel],
        ["[data-story-media]", media], ["[data-story-status]", status],
    ]);
    story.querySelector = selector => selectors.get(selector) || null;
    story.querySelectorAll = () => [];
    story.ownerDocument = document;
    const root = new TestElement();
    root.ownerDocument = document;
    root.querySelector = selector => selectors.get(selector) || null;
    function change(value) {
        choice.dataset.storySpace = value;
        choice.value = value;
        choice.checked = true;
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, "target", { value: choice });
        story.dispatchEvent(event);
    }
    return { root, story, panel, media, status, preference, view, frames, change };
}

test("Choosing a space commits its matching description and detail destination, and invalid values do not replace it", async () => {
    const { bindStory } = await loadStory();
    const f = fixture(true);
    const cleanup = bindStory(f.root, "/about");
    f.change("s-theater");
    assert.match(f.panel.innerHTML, /세종S씨어터/);
    assert.match(f.panel.innerHTML, /블랙박스형/);
    assert.match(f.panel.innerHTML, /href="#\/visit\/spaces\/s-theater"/);
    assert.match(f.panel.innerHTML, /venue-s\.svg/);
    assert.match(f.status.textContent, /세종S씨어터/);
    const chosen = f.panel.innerHTML;
    f.change("unknown-space");
    assert.equal(f.panel.innerHTML, chosen);
    assert.equal(f.frames.size, 0, "Reduced motion never schedules scroll animation");
    cleanup();
    f.change("grand");
    assert.equal(f.panel.innerHTML, chosen, "Route cleanup removes the selector handler");
});

test("Scroll work is coalesced, reduced motion resolves immediately, and route cleanup cancels pending frames", async () => {
    const { bindStory } = await loadStory();
    const f = fixture();
    const cleanup = bindStory(f.root, "/about/introduction");
    f.view.dispatchEvent(new Event("scroll"));
    f.view.dispatchEvent(new Event("scroll"));
    assert.equal(f.frames.size, 1);
    const [id, run] = [...f.frames][0];
    f.frames.delete(id);
    run();
    assert.ok(f.media.attributes.size > 0, "A visible hero receives a bounded scroll state");
    f.preference.matches = true;
    f.preference.dispatchEvent(new Event("change"));
    assert.equal(f.media.attributes.size, 0, "Preference changes restore the full static image");
    assert.equal(f.frames.size, 0);
    f.preference.matches = false;
    f.preference.dispatchEvent(new Event("change"));
    assert.equal(f.frames.size, 1);
    cleanup();
    assert.equal(f.frames.size, 0);
    f.view.dispatchEvent(new Event("scroll"));
    assert.equal(f.frames.size, 0, "Detached pages do not restart work");
});
