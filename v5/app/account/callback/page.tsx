"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SystemLink, SystemNotice } from "../../../components/SystemPrimitives";
import { supabase } from "../../../src/lib/supabase.ts";

// [정적 PKCE 복귀 처리 / Static PKCE callback handling]
// Exchange explicitly so a missing verifier cannot fall back to an older session.
export default function AccountCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const exchange = useRef<Promise<void> | null>(null);

    useEffect(() => {
        let mounted = true;
        const complete = async () => {
            if (!supabase) throw new Error("로그인 서비스 연결을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.");
            const query = new URLSearchParams(window.location.search);
            const fragment = new URLSearchParams(window.location.hash.slice(1));
            const providerError = query.get("error") || fragment.get("error");
            if (providerError) throw new Error(providerError === "access_denied" ? "Google 로그인이 취소되었습니다. 다시 시도할 수 있습니다." : "Google 로그인을 완료하지 못했습니다. 로그인 화면에서 다시 시도해 주세요.");
            const code = query.get("code");
            if (!code) throw new Error("로그인 요청이 만료되었거나 같은 브라우저에서 시작되지 않았습니다. 다시 로그인해 주세요.");
            if (!exchange.current) exchange.current = supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
                if (exchangeError || !data.session) throw new Error("로그인 요청이 만료되었거나 같은 브라우저에서 시작되지 않았습니다. 로그인 화면에서 다시 시도해 주세요.");
            });
            await exchange.current;
            // Remove the single-use authorization code from browser history.
            window.history.replaceState(null, "", window.location.pathname);
            if (mounted) router.replace("/account");
        };
        void complete().catch(cause => {
            if (mounted) setError(cause instanceof Error ? cause.message : "로그인을 완료하지 못했습니다.");
        });
        return () => { mounted = false; };
    }, [router]);

    return <div className="flow-page account-page">
        <section className="page-heading"><div className="container"><h1 data-text="title">Google 계정 연결</h1></div></section>
        <div className="container page-content flow-content"><section data-text="body" className="flow-panel account-narrow" aria-busy={!error}>
            {error ? <><SystemNotice data-text="body" error variant="flow">{error}</SystemNotice><SystemLink data-text="action" context="flow" href="/account/login">로그인으로 돌아가기</SystemLink></>
                : <p data-text="body" role="status" aria-live="polite">로그인을 확인하고 있습니다. 잠시만 기다려 주세요.</p>}
        </section></div>
    </div>;
}
