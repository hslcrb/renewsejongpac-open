import { esc, href, icon, money, readStore, writeStore, navigate, toast } from "../lib/core.js";
import { pageHeader, emptyState } from "../components/ui.js";
import { animateFeedback, cancelMotion, captureLayout, animateLayout } from "../components/motion.js";

// [굿즈 상품과 저장 데이터 / Goods catalog and stored data]
// 기존 콘셉트에 예시 가격을 연결하고 저장된 값은 사용 전에 검증합니다.
// Keep the existing concepts, label sample prices, and validate stored values before use.
export const GOODS = [
    { id: "art-postcards", title: "공연의 한 장면", category: "엽서", description: "포스터와 작품의 분위기를 담는 아트 카드.", detail: "마음에 남은 무대의 색과 형태를 작은 종이 위에 담았습니다. 책상 위에 세워 두거나, 소중한 사람에게 짧은 감상을 전해 보세요.", price: 6000, material: "종이 · 엽서 3장 구성", size: "100 × 150mm", symbol: "↗", art: 0 },
    { id: "canvas-bag", title: "예술을 담는 가방", category: "가방", description: "일상의 이동에 함께하는 가벼운 캔버스 백.", detail: "프로그램북과 오늘 읽을 책을 함께 넣는 가방. 공연장을 향하는 길부터 일상의 산책까지, 예술과 가까운 하루를 위한 콘셉트입니다.", price: 18000, material: "면 캔버스 · 단일 색상", size: "350 × 400mm", symbol: "S", art: 1 },
    { id: "viewing-journal", title: "나만의 관람 기록", category: "노트", description: "마음에 남은 무대와 감상을 모으는 노트.", detail: "공연 제목, 날짜, 함께한 사람과 오래 기억하고 싶은 장면을 적어 보세요. 한 장씩 쌓이는 기록이 나만의 공연 이야기가 됩니다.", price: 9000, material: "종이 · 무선 제본 · 80쪽", size: "148 × 210mm", symbol: "N", art: 2 },
];

const basePath = "/news/goods";
const sessionOnlyKeys = new Set();
const findGood = (id) => GOODS.find((good) => good.id === id);
const quantityOK = (value) => Number.isInteger(value) && value >= 1 && value <= 10;
const total = (items) => items.reduce((sum, item) => sum + findGood(item.id).price * item.quantity, 0);

function cleanItems(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw.filter((item) => {
        if (!item || !findGood(item.id) || !quantityOK(item.quantity) || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    }).map(({ id, quantity }) => ({ id, quantity }));
}

// 다른 탭의 변경은 최종 검토와 확정 사이에도 반영하되 저장 실패 시 메모리 대체값을 보존합니다.
// Read changes from other tabs while retaining the memory fallback after failed storage writes.
function storedData(key) {
    const fallback = readStore(key, []);
    if (sessionOnlyKeys.has(key)) return fallback;
    try {
        if (!globalThis.localStorage) return fallback;
        const data = JSON.parse(globalThis.localStorage.getItem("sejong-v3:" + key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return fallback;
    }
}

const cartItems = () => cleanItems(storedData("goods-cart"));
const itemSignature = (items) => JSON.stringify([...items].sort((left, right) => left.id.localeCompare(right.id)));
function savedOrders() {
    const seen = new Set();
    return storedData("goods-orders").filter((order) => {
        if (!order || typeof order.id !== "string" || !/^goods-[a-z0-9-]{1,80}$/i.test(order.id) || seen.has(order.id)) return false;
        if (typeof order.createdAt !== "string" || !Number.isFinite(Date.parse(order.createdAt))) return false;
        if (!["confirmed", "cancelled"].includes(order.status) || !Array.isArray(order.items) || !order.items.length) return false;
        if (cleanItems(order.items).length !== order.items.length) return false;
        seen.add(order.id);
        return true;
    }).map((order) => ({ id: order.id, createdAt: order.createdAt, status: order.status, items: cleanItems(order.items) }));
}

function artwork(good) {
    return `<div class="goods-art goods-art-${good.art}" aria-hidden="true"><span>${good.symbol}</span><small>SEJONG CENTER</small></div>`;
}

function goodsNavigation(path) {
    const count = cartItems().reduce((sum, item) => sum + item.quantity, 0);
    return `<nav class="goods-navigation" aria-label="굿즈 메뉴">
        <a href="${href(basePath)}"${path === basePath ? ' aria-current="page"' : ""}>굿즈 둘러보기</a>
        <a href="${href(basePath + "/cart")}"${path === basePath + "/cart" ? ' aria-current="page"' : ""}>장바구니 <span data-goods-count>${count}</span></a>
        <a href="${href(basePath + "/orders")}"${path === basePath + "/orders" ? ' aria-current="page"' : ""}>주문 체험 내역</a>
    </nav>`;
}

function shell(path, title, description, body) {
    return pageHeader({ path, title, description, group: "news" }) + `<div class="container page-content goods-page" data-goods-page>
        ${goodsNavigation(path)}
        <p class="goods-demo-note">상품·이미지·규격·가격은 체험용 예시입니다. 실제 판매 상품이 아니며, 결제와 배송은 이루어지지 않습니다.</p>
        <div data-goods-content>${body}</div>
        <p class="goods-feedback" data-goods-feedback role="status" aria-live="polite"></p>
    </div>`;
}

function quantitySelect(good, quantity, purpose) {
    const id = `goods-quantity-${good.id}`;
    return `<label class="goods-quantity" for="${id}"><span>수량</span><select id="${id}" name="quantity" data-goods-quantity="${good.id}" data-purpose="${purpose}" aria-label="${esc(good.title)} 수량">${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}"${quantity === index + 1 ? " selected" : ""}>${index + 1}개</option>`).join("")}</select></label>`;
}

// [상품 탐색과 상세 / Product discovery and details]
// 상품명·가격·수량과 실제 조작을 같은 읽기 순서에 둡니다.
// Keep product information, pricing, quantities, and actions in reading order.
function collection() {
    return `<section id="goods-collection" aria-labelledby="goods-collection-heading">
        <div class="info-statement"><h2 id="goods-collection-heading">무대의 기억이<br>일상의 취향으로.</h2><p>예술과 함께한 순간을 오래 간직하는 작은 방법. 세종의 이야기를 담은 굿즈를 살펴보세요.</p></div>
        <div class="goods-grid">${GOODS.map((good) => `<article class="goods-product">
            <a class="goods-product-link" href="${href(basePath + "/" + good.id)}">${artwork(good)}<span class="eyebrow">${good.category}</span><h3>${good.title}</h3><p>${good.description}</p><p class="goods-price"><span>예시 가격</span> <strong>${money(good.price)}</strong></p><span class="text-link">자세히 보기 ${icon("arrow", 18)}</span></a>
        </article>`).join("")}</div>
    </section>`;
}

function productDetail(good) {
    return `<section class="goods-detail" id="goods-product-${good.id}" aria-labelledby="goods-detail-heading">
        <div class="goods-detail-art">${artwork(good)}<p>상품의 형태와 분위기를 보여주는 콘셉트 일러스트입니다.</p></div>
        <div class="goods-detail-information">
            <span class="eyebrow">${good.category}</span><h2 id="goods-detail-heading">${good.title}</h2><p class="goods-description">${good.detail}</p>
            <dl class="goods-specs"><div><dt>예시 가격</dt><dd>${money(good.price)}</dd></div><div><dt>구성·소재</dt><dd>${good.material}</dd></div><div><dt>예시 규격</dt><dd>${good.size}</dd></div></dl>
            <form data-goods-add="${good.id}">
                ${quantitySelect(good, 1, "detail")}
                <p class="goods-selection-total">선택 금액 <strong data-goods-selection-total>${money(good.price)}</strong></p>
                <p class="goods-demo-note">장바구니와 주문 체험 내역은 이 브라우저에만 저장됩니다. 실제 주문은 접수되지 않습니다.</p>
                <div class="goods-actions"><button class="button button--yellow" type="submit">장바구니에 담기 ${icon("arrow", 18)}</button><a class="text-link" href="${href(basePath + "/cart")}">장바구니 보기</a></div>
            </form>
        </div>
    </section>`;
}

// [장바구니와 주문 검토 / Cart and order review]
// 입력 중인 컨트롤을 보존하며 합계와 안내를 함께 갱신합니다.
// Preserve controls while updating totals and provide a review step before confirmation.
function cartRows(items, editable) {
    return `<ul class="goods-cart-list">${items.map((item) => {
        const good = findGood(item.id);
        return `<li class="goods-cart-row" data-goods-cart-row="${good.id}" data-motion-key="cart-${good.id}">
            <a class="goods-cart-art" href="${href(basePath + "/" + good.id)}" aria-label="${good.title} 상세 보기">${artwork(good)}</a>
            <div class="goods-cart-information"><h2><a href="${href(basePath + "/" + good.id)}">${good.title}</a></h2><p>개당 예시 가격 ${money(good.price)}</p>${editable ? quantitySelect(good, item.quantity, "cart") : `<p>수량 ${item.quantity}개</p>`}</div>
            <div class="goods-cart-amount"><strong data-goods-line-total="${good.id}">${money(good.price * item.quantity)}</strong>${editable ? `<button class="text-link" type="button" data-goods-remove="${good.id}" aria-label="${good.title} 장바구니에서 삭제">삭제</button>` : ""}</div>
        </li>`;
    }).join("")}</ul>`;
}

function orderSummary(items) {
    return `<dl class="goods-summary"><div><dt>상품 합계</dt><dd data-goods-total>${money(total(items))}</dd></div><div><dt>배송</dt><dd>배송 없는 체험</dd></div><div class="goods-summary-total"><dt>예시 주문 금액</dt><dd data-goods-total>${money(total(items))}</dd></div></dl>`;
}

function cart(review = false) {
    const items = cartItems();
    if (!items.length) return emptyState("장바구니가 비어 있어요", "마음에 드는 굿즈를 골라 장바구니에 담아 보세요.", basePath, "굿즈 둘러보기");
    return `<section id="goods-cart" aria-labelledby="goods-cart-heading">
        <ol class="goods-order-steps" aria-label="주문 체험 단계"><li${!review ? ' aria-current="step"' : ""}>1. 장바구니</li><li${review ? ' aria-current="step"' : ""}>2. 주문 검토</li><li>3. 체험 완료</li></ol>
        <h2 id="goods-cart-heading" tabindex="-1">${review ? "선택한 굿즈를 확인해 주세요" : "담아 둔 굿즈"}</h2>
        ${cartRows(items, !review)}${orderSummary(items)}
        ${review ? `<form class="goods-confirmation" data-goods-order data-goods-reviewed="${esc(JSON.stringify(items))}">
            <p>실제 결제·배송 없이 주문 과정을 체험합니다. 이름, 주소, 결제정보는 입력하지 않으며 내역은 이 브라우저에만 보관됩니다.</p>
            <label class="goods-consent"><input type="checkbox" name="consent" required> 실제 주문이 아닌 로컬 체험임을 확인했습니다.</label>
            <div class="goods-actions"><button class="button button--yellow" type="submit" data-goods-confirm>주문 체험 확정 ${icon("arrow", 18)}</button><a class="text-link" href="${href(basePath + "/cart")}">장바구니 수정</a></div>
        </form>` : `<div class="goods-actions"><a class="button button--yellow" href="${href(basePath + "/cart?step=review")}">주문 검토하기 ${icon("arrow", 18)}</a><a class="text-link" href="${href(basePath)}">계속 둘러보기</a></div>`}
    </section>`;
}

// [주문 내역과 취소 / Order history and cancellation]
// 주문·취소 상태를 브라우저에 보관하고 실제 결제로 오인하지 않도록 표시합니다.
// Persist local order and cancellation states without implying a real payment.
function orderHistory(query) {
    const orders = savedOrders();
    if (!orders.length) return emptyState("아직 주문 체험 내역이 없어요", "굿즈를 담고 주문 검토를 마치면 이곳에서 내역을 확인할 수 있습니다.", basePath, "굿즈 둘러보기");
    const receipt = query.get("receipt");
    const stored = query.get("storage") !== "session";
    return `${orders.some((order) => order.id === receipt && order.status === "confirmed") ? `<div class="goods-receipt" role="status"><h2>주문 체험을 완료했어요</h2><p>${stored ? "이 브라우저에 체험 내역을 저장했습니다." : "브라우저 저장소를 사용할 수 없어 현재 페이지를 열어 둔 동안만 내역이 유지됩니다."} 실제 결제와 배송은 진행되지 않습니다.</p></div>` : ""}
        <section class="goods-orders" id="goods-orders" aria-label="저장한 주문 체험 내역">${orders.map((order) => `<article class="goods-order" id="${order.id}" data-goods-order-id="${order.id}" data-motion-key="order-${order.id}">
            <div class="goods-order-heading"><div><h2 tabindex="-1">${new Date(order.createdAt).toLocaleDateString("ko-KR")} 주문 체험</h2><p>체험 번호 ${esc(order.id)}</p></div><strong class="goods-order-status">${order.status === "cancelled" ? "취소됨" : "체험 완료"}</strong></div>
            <ul class="goods-order-items">${order.items.map((item) => `<li><span>${findGood(item.id).title} · ${item.quantity}개</span><strong>${money(findGood(item.id).price * item.quantity)}</strong></li>`).join("")}</ul>
            <p class="goods-order-total">예시 주문 금액 <strong>${money(total(order.items))}</strong></p>
            ${order.status === "confirmed" ? `<details class="goods-cancel-confirm"><summary>주문 체험 취소</summary><div><p>이 내역을 취소 상태로 변경할까요? 실제 결제 내역이 없어 환불은 발생하지 않습니다.</p><div class="goods-actions"><button class="button button--dark" type="button" data-goods-cancel="${order.id}">취소 확정</button><button class="text-link" type="button" data-goods-keep>내역 유지</button></div></div></details>` : `<p class="goods-demo-note">취소한 체험 내역입니다.</p>`}
        </article>`).join("")}</section>`;
}

export function renderGoods(path, query = new URLSearchParams()) {
    if (path !== basePath && !path.startsWith(basePath + "/")) return null;
    if (path === basePath) return shell(path, "세종 굿즈", "무대의 기억을 일상으로 가져오세요.", collection());
    if (path === basePath + "/cart") return shell(path, "굿즈 장바구니", "선택한 상품과 예시 금액을 확인하세요.", cart(query.get("step") === "review"));
    if (path === basePath + "/orders") return shell(path, "굿즈 주문 체험 내역", "이 브라우저에 저장한 주문 체험을 확인하고 관리하세요.", orderHistory(query));
    const good = findGood(path.slice(basePath.length + 1));
    return shell(path, good?.title || "상품을 찾을 수 없어요", good?.description || "", good ? productDetail(good) : emptyState("상품 주소를 확인해 주세요", "굿즈 목록에서 다시 선택할 수 있습니다.", basePath, "굿즈 둘러보기"));
}

export function bindGoods(root, path, query = new URLSearchParams()) {
    const page = root.querySelector("[data-goods-page]");
    if (!page) return;
    const controller = new AbortController();
    const { signal } = controller;
    let submitted = false;
    // [수량·안내·목록 변화의 피드백 / Quantity, message and list feedback]
    // 숫자는 즉시 표시하며 입력 위치와 삭제 후 다음 조작 대상을 유지합니다.
    // Show exact numbers immediately and preserve inputs and the next action after removal.
    const feedback = (message, kind = "status") => {
        const result = page.querySelector("[data-goods-feedback]");
        result.textContent = message;
        animateFeedback(result, kind);
    };
    const persist = (key, data) => {
        const stored = writeStore(key, data);
        if (!stored) {
            sessionOnlyKeys.add(key);
            feedback("브라우저 저장소를 사용할 수 없어 현재 페이지를 열어 둔 동안만 변경 사항이 유지됩니다.");
        } else sessionOnlyKeys.delete(key);
        return stored;
    };
    const updateCount = () => {
        const count = page.querySelector("[data-goods-count]");
        const next = String(cartItems().reduce((sum, item) => sum + item.quantity, 0));
        if (count.textContent === next) return;
        count.textContent = next;
        animateFeedback(count, "amount");
    };
    const updateContent = (html, { layout = false, focus = "", target = "" } = {}) => {
        const container = page.querySelector("[data-goods-content]");
        const snapshot = layout ? captureLayout(container, "[data-motion-key]") : null;
        cancelMotion(container);
        container.innerHTML = html;
        const focusTarget = focus ? container.querySelector(focus) : null;
        if (focusTarget) {
            if (!focusTarget.matches("a, button, input, select, textarea, summary, [tabindex]")) focusTarget.tabIndex = -1;
            focusTarget.focus({ preventScroll: Boolean(layout) });
        }
        if (snapshot) animateLayout(container, snapshot, "[data-motion-key]");
        else page.dispatchEvent(new CustomEvent("content:updated", { bubbles: true, detail: { container, kind: "panel" } }));
        if (target) animateFeedback(container.querySelector(target), "status");
    };

    page.addEventListener("invalid", (event) => {
        feedback(event.target.type === "checkbox" ? "주문 체험 안내를 확인하고 동의해 주세요." : "선택한 수량을 확인해 주세요.", "error");
    }, { capture: true, signal });

    page.addEventListener("change", (event) => {
        const select = event.target.closest("[data-goods-quantity]");
        if (!select) return;
        const good = findGood(select.dataset.goodsQuantity);
        const quantity = Number(select.value);
        if (!good || !quantityOK(quantity)) return;
        if (select.dataset.purpose === "detail") {
            const amount = page.querySelector("[data-goods-selection-total]");
            amount.textContent = money(good.price * quantity);
            animateFeedback(amount, "amount");
        } else {
            const items = cartItems().map((item) => item.id === good.id ? { ...item, quantity } : item);
            const stored = persist("goods-cart", items);
            const amount = page.querySelector(`[data-goods-line-total="${good.id}"]`);
            amount.textContent = money(good.price * quantity);
            animateFeedback(amount, "amount");
            page.querySelectorAll("[data-goods-total]").forEach((node) => {
                node.textContent = money(total(items));
                animateFeedback(node, "amount");
            });
            updateCount();
            if (stored) feedback(`${good.title} 수량을 ${quantity}개로 변경했습니다. 예시 합계 ${money(total(items))}.`);
        }
    }, { signal });

    page.addEventListener("submit", (event) => {
        const addForm = event.target.closest("[data-goods-add]");
        const orderForm = event.target.closest("[data-goods-order]");
        if (!addForm && !orderForm) return;
        event.preventDefault();
        if (!event.target.reportValidity()) return;
        if (addForm) {
            const good = findGood(addForm.dataset.goodsAdd);
            const quantity = Number(new FormData(addForm).get("quantity"));
            if (!good || !quantityOK(quantity)) return;
            const items = cartItems();
            const existing = items.find((item) => item.id === good.id);
            if ((existing?.quantity || 0) + quantity > 10) {
                feedback("상품별로 최대 10개까지 담을 수 있습니다. 장바구니에서 수량을 확인해 주세요.", "error");
                return;
            }
            if (existing) existing.quantity += quantity;
            else items.push({ id: good.id, quantity });
            const stored = persist("goods-cart", items);
            updateCount();
            if (stored) feedback(`${good.title} ${quantity}개를 장바구니에 담았습니다.`);
            toast("장바구니에 담았어요.");
            return;
        }
        if (submitted || !orderForm.elements.consent.checked) return;
        const items = cartItems();
        if (!items.length) {
            updateContent(cart(), { focus: ".empty-state h2" });
            feedback("장바구니가 비어 있어 주문 체험을 진행할 수 없습니다.", "error");
            return;
        }
        let reviewedItems = [];
        try { reviewedItems = cleanItems(JSON.parse(orderForm.dataset.goodsReviewed || "[]")); } catch { /* Rebuild an invalid review below. */ }
        if (itemSignature(items) !== itemSignature(reviewedItems)) {
            updateContent(cart(true), { focus: "#goods-cart-heading" });
            updateCount();
            feedback("다른 탭에서 장바구니가 변경되어 상품과 금액을 다시 표시했습니다. 변경된 내용을 확인한 뒤 다시 동의해 주세요.");
            return;
        }
        submitted = true;
        orderForm.querySelector("[data-goods-confirm]").disabled = true;
        const id = "goods-" + (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
        const order = { id, createdAt: new Date().toISOString(), status: "confirmed", items };
        const stored = persist("goods-orders", [order, ...savedOrders()]);
        persist("goods-cart", []);
        navigate(`${basePath}/orders?receipt=${encodeURIComponent(id)}${stored ? "" : "&storage=session"}`);
    }, { signal });

    page.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-goods-remove]");
        if (remove) {
            const id = remove.dataset.goodsRemove;
            const title = findGood(id)?.title;
            if (!title) return;
            const row = remove.closest("[data-goods-cart-row]");
            const sibling = row.nextElementSibling || row.previousElementSibling;
            const focus = sibling ? `[data-goods-cart-row="${sibling.dataset.goodsCartRow}"] [data-goods-quantity]` : ".empty-state h2";
            const stored = persist("goods-cart", cartItems().filter((item) => item.id !== id));
            updateCount();
            updateContent(cart(), { layout: true, focus, target: sibling ? "" : ".empty-state" });
            if (stored) feedback(`${title}을 장바구니에서 삭제했습니다.`);
        }
        const keep = event.target.closest("[data-goods-keep]");
        if (keep) {
            const details = keep.closest("details");
            const summary = details.querySelector("summary");
            summary.click();
            summary.focus();
        }
        const cancel = event.target.closest("[data-goods-cancel]");
        if (cancel) {
            const id = cancel.dataset.goodsCancel;
            const orders = savedOrders();
            if (!orders.some((order) => order.id === id && order.status === "confirmed")) return;
            const stored = persist("goods-orders", orders.map((order) => order.id === id ? { ...order, status: "cancelled" } : order));
            history.replaceState(null, "", href(basePath + "/orders"));
            updateContent(orderHistory(new URLSearchParams()), { layout: true, focus: `#${id} h2`, target: `#${id} .goods-order-status` });
            if (stored) feedback("주문 체험을 취소했습니다. 실제 결제나 환불은 발생하지 않습니다.");
        }
    }, { signal });

    return () => {
        controller.abort();
        cancelMotion(page);
    };
}
