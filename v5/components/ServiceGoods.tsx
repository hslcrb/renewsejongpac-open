"use client";

import { useEffect, useRef, useState } from "react";
import type { CompletionPage } from "../src/page-completion/types";
import type { ServiceCartLine, ServiceGood, ServiceRequest } from "../src/page-completion/requests";
import { cancelServiceRequest, loadServiceCart, loadServiceGoods, loadServiceRequests, setServiceCartQuantity } from "../src/page-completion/request-db";
import useAccountIdentity from "./useAccountIdentity";
import ServiceRequestForm from "./ServiceRequestForm";
import DeepSearchDisclosure from "./DeepSearchDisclosure";
import { contextSearchReply } from "./DeepSearch";
import SystemSurface from "./SystemSurface";
import { SystemButton, SystemField, SystemLink, SystemNotice } from "./SystemPrimitives";
import { SystemDisclosure } from "./SystemNavigation";
import { showSmallNotification } from "./SmallNotificationModal";
import "../styles/service-requests.css";

const money = (price: number | null) => price == null ? "가격 확인 필요" : `${price.toLocaleString("ko-KR")}원`;

// [실제 상품과 본인 장바구니·구매 요청 / Published goods, owner carts and purchase requests]
export default function ServiceGoods({ mode, page }: { mode: "goods" | "cart" | "orders"; page: CompletionPage }) {
    const identity = useAccountIdentity();
    const owner = identity.isLoggedIn ? identity.identityId : null;
    const activeOwner = useRef(owner); activeOwner.current = owner;
    const generation = useRef(0);
    const [goods, setGoods] = useState<ServiceGood[]>([]);
    const [cart, setCart] = useState<ServiceCartLine[]>([]);
    const [orders, setOrders] = useState<ServiceRequest[]>([]);
    const [receipt, setReceipt] = useState<ServiceRequest | null>(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [failure, setFailure] = useState("");
    const [pending, setPending] = useState("");
    const [refresh, setRefresh] = useState(0);
    const heading = mode === "goods" ? "굿즈 둘러보기" : mode === "cart" ? "나의 장바구니" : "나의 구매 요청";
    const cartPage: CompletionPage = { ...page, path: "/news/goods/cart", form: { kind: "order", title: "구매 요청", description: "상품과 수량을 확인한 뒤 연락받을 정보를 남겨 주세요. 이 단계에서 결제되거나 상품 재고가 확보되지는 않습니다." } };

    useEffect(() => {
        let stopped = false;
        generation.current += 1;
        const capturedOwner = owner;
        setCart([]); setOrders([]); setReceipt(null); setFailure(""); setPending(""); setLoading(true);
        const work = mode === "goods" ? loadServiceGoods().then(rows => { if (!stopped) setGoods(rows); })
            : owner && mode === "cart" ? loadServiceCart(owner).then(rows => { if (!stopped && activeOwner.current === capturedOwner) setCart(rows); })
            : owner ? loadServiceRequests(owner).then(rows => { if (!stopped && activeOwner.current === capturedOwner) setOrders(rows.filter(row => row.kind === "order")); }) : Promise.resolve();
        void work.catch(error => { if (!stopped) setFailure(error instanceof Error ? error.message : "목록을 불러오지 못했습니다."); })
            .finally(() => { if (!stopped) setLoading(false); });
        return () => { stopped = true; };
    }, [mode, owner, refresh]);

    async function quantity(good: ServiceGood, next: number) {
        if (!owner) { setFailure("로그인한 뒤 장바구니에 담아 주세요."); return; }
        if (pending) return;
        const capturedOwner = owner;
        setPending(good.id); setFailure("");
        const capturedGeneration = generation.current;
        const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
        try {
            await setServiceCartQuantity(owner, good.id, next, mode === "goods");
            if (!current()) return;
            if (mode === "cart") { const rows = await loadServiceCart(owner); if (current()) setCart(rows); }
            if (current()) showSmallNotification(next ? "장바구니에 저장했습니다." : "장바구니에서 삭제했습니다.");
        } catch (error) { if (current()) setFailure(error instanceof Error ? error.message : "장바구니를 변경하지 못했습니다."); }
        finally { if (current()) setPending(""); }
    }
    async function cancel(request: ServiceRequest) {
        if (!owner || pending) return;
        const capturedOwner = owner;
        setPending(request.id); setFailure("");
        const capturedGeneration = generation.current;
        const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
        try {
            const next = await cancelServiceRequest(owner, request.id);
            if (current()) { setOrders(rows => rows.map(item => item.id === next.id ? next : item)); showSmallNotification("구매 요청을 취소했습니다."); }
        } catch (error) { if (current()) setFailure(error instanceof Error ? error.message : "요청을 취소하지 못했습니다."); }
        finally { if (current()) setPending(""); }
    }
    const filtered = goods.filter(good => `${good.title} ${good.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const total = cart.every(line => line.sejong_goods.price != null) ? cart.reduce((sum, line) => sum + (line.sejong_goods.price || 0) * line.quantity, 0) : null;
    return <section className="service-goods" data-component-id="service-goods" data-goods-mode={mode} aria-label={heading}>
        <div className="service-goods-toolbar"><h2 data-text="subheading">{heading}</h2><div className="service-request-actions"><SystemLink href="/news/goods" variant="quiet" shape="pill">상품 목록</SystemLink><SystemLink href="/news/goods/cart" variant="secondary" shape="pill">장바구니</SystemLink><SystemLink href="/news/goods/orders" variant="secondary" shape="pill">구매 요청 내역</SystemLink></div></div>
        {failure && <SystemNotice error>{failure}<SystemButton variant="quiet" onClick={() => setRefresh(value => value + 1)}>다시 불러오기</SystemButton></SystemNotice>}
        {mode === "goods" && <SystemField type="search" label="상품 검색" value={query} onChange={event => setQuery(event.currentTarget.value)} />}
        {mode === "goods" && <DeepSearchDisclosure title="대화로 굿즈 검색" onSearch={term => contextSearchReply(term, goods.map(good => ({ title: good.title, description: good.description })), "굿즈")} />}
        {receipt && <SystemNotice title="구매 요청을 저장했습니다"><p data-text="body">접수번호 {receipt.reference}</p><p data-text="body">결제·배송 전 상태입니다. 구매 요청 내역에서 상품과 수량을 확인하고 취소할 수 있습니다.</p><SystemLink href="/news/goods/orders" variant="secondary" shape="pill">구매 요청 내역 확인</SystemLink></SystemNotice>}
        {loading ? <p data-text="body" role="status">목록을 불러오고 있습니다.</p> : mode !== "goods" && !owner ? <SystemNotice title="로그인 후 확인할 수 있습니다"><SystemLink href="/account/login" target="_blank" variant="secondary" shape="pill">로그인하기 · 새 창</SystemLink></SystemNotice>
            : mode === "goods" ? <>{!filtered.length && <SystemNotice>조건에 맞는 상품이 없습니다.</SystemNotice>}<div className="service-goods-grid">{filtered.map(good => <SystemSurface key={good.id} padding="lg" className="service-goods-card">
                {good.image && <img className="service-goods-image" src={good.image} alt={good.title} width={480} height={480} loading="lazy" />}
                <h3 data-text="item-title">{good.title}</h3><p data-text="body">{good.description}</p><strong data-text="item-title">{money(good.price)}</strong>
                <div className="service-request-actions"><SystemButton shape="pill" disabled={Boolean(pending)} onClick={() => void quantity(good, 1)}>{pending === good.id ? "저장 중" : "장바구니 담기"}</SystemButton><SystemLink variant="quiet" href={good.source_url} target="_blank">상품 원문</SystemLink></div>
            </SystemSurface>)}</div>{!owner && <SystemLink href="/account/login" target="_blank" variant="secondary" shape="pill">로그인하고 장바구니 사용하기 · 새 창</SystemLink>}</>
            : mode === "cart" ? !cart.length ? <SystemNotice title="장바구니가 비어 있습니다"><SystemLink href="/news/goods" variant="secondary" shape="pill">상품 둘러보기</SystemLink></SystemNotice>
                : <><div className="service-cart-lines">{cart.map(line => <SystemSurface key={line.good_id} padding="lg" className="service-cart-line"><div><h3 data-text="item-title">{line.sejong_goods.title}</h3><p data-text="meta">개당 {money(line.sejong_goods.price)}</p></div><SystemField as="select" label={`${line.sejong_goods.title} 수량`} value={String(line.quantity)} disabled={Boolean(pending)} onChange={event => void quantity(line.sejong_goods, Number(event.currentTarget.value))}>{Array.from({ length: 20 }, (_, i) => <option data-text="body" key={i + 1} value={i + 1}>{i + 1}개</option>)}</SystemField><SystemButton variant="quiet" shape="pill" disabled={Boolean(pending)} onClick={() => void quantity(line.sejong_goods, 0)}>삭제</SystemButton></SystemSurface>)}</div><div className="service-cart-total"><span data-text="label">상품 금액 합계</span><strong data-text="subheading">{money(total)}</strong></div><p data-text="body">배송비·재고·결제 조건은 요청 확인 후 안내됩니다.</p><ServiceRequestForm page={cartPage} onSaved={request => { setReceipt(request); setCart([]); }} /></>
            : !orders.length ? <SystemNotice>저장한 구매 요청이 없습니다.</SystemNotice> : orders.map(order => <SystemDisclosure key={order.id} summary={<span data-text="label">{order.reference} · {order.status === "cancelled" ? "취소" : "구매 요청 · 결제 전"}</span>}>
                <p data-text="meta">{new Date(order.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p><ul className="service-order-lines">{(Array.isArray(order.values.items) ? order.values.items : []).map((item: { id: string; title: string; quantity: number; unitPrice: number | null }) => <li data-text="body" key={item.id}><span data-text="body">{item.title} × {item.quantity}</span><span data-text="body">{money(item.unitPrice == null ? null : item.unitPrice * item.quantity)}</span></li>)}</ul><p data-text="item-title">상품 금액 {money(typeof order.values.total === "number" ? order.values.total : null)}</p>
                {order.status === "submitted" && <SystemButton variant="secondary" shape="pill" disabled={Boolean(pending)} onClick={() => void cancel(order)}>{pending === order.id ? "취소 중" : "구매 요청 취소"}</SystemButton>}
            </SystemDisclosure>)}
    </section>;
}
