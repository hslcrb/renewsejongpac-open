"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { SystemButton, SystemField, SystemNotice } from "../../../components/SystemPrimitives";
import { SystemSurface } from "../../../components/SystemSurface";
import { requestEmailSignIn } from "../../../src/lib/supabase.ts";

export default function RecoveryPage() {
    const [email, setEmail] = useState("");
    const [recoveryResult, setRecoveryResult] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [pending, setPending] = useState(false);

    // [존재 여부를 조회하지 않는 이메일 복구 / Email recovery without an account-existence lookup]
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (pending) return;
        setErrorMessage("");
        setRecoveryResult(null);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErrorMessage("유효한 이메일을 입력해 주세요.");
            return;
        }

        setPending(true);
        try {
            await requestEmailSignIn(email.trim(), { createUser: false });
            setRecoveryResult("이메일로 로그인 링크를 보냈습니다.");
        } catch {
            setErrorMessage("로그인 링크를 보내지 못했습니다. 이메일을 확인하고 잠시 후 다시 시도해 주세요.");
        } finally {
            setPending(false);
        }
    };

    // [계정 공통 조작 / Shared account form controls]
    return (
        <div className="flow-page account-page">
            <section className="page-heading" id="page-heading">
                <div className="container">
                    <nav className="breadcrumbs" aria-label="현재 위치">
                        <Link data-text="action" href="/">홈</Link>
                        <span data-text="body" aria-hidden="true">/</span>
                        <Link data-text="action" href="/account">마이페이지</Link>
                        <span data-text="body" aria-hidden="true">/</span>
                        <span data-text="body" aria-current="page">계정 찾기</span>
                    </nav>
                    <div className="page-title-row">
                        <div>
                            <h1 data-text="title">계정 찾기</h1>
                            <p data-text="body" className="page-description">예매 내역과 관심 프로그램을 관리하는 페이지입니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container page-content flow-content">
                <SystemSurface as="form" variant="panel" padding="lg" className="flow-panel account-narrow" data-account-auth="recovery" onSubmit={handleSubmit} noValidate>
                    <div className="flow-panel-heading">
                        <h2 data-text="heading">이메일로 다시 로그인</h2>
                        <p data-text="body">가입한 이메일로 로그인 링크를 받으세요.</p>
                    </div>

                    {errorMessage && (
                        <SystemNotice data-text="body" variant="flow" error className="flow-error" id="flow-error" tabIndex={-1}>
                            {errorMessage}
                        </SystemNotice>
                    )}

                    <SystemField data-text="body"
                        variant="flow"
                        outerClassName="form-field"
                        label={<>이메일 <span data-text="body" className="flow-required" aria-hidden="true">*</span>
                            <span data-text="body" className="sr-only">필수</span></>}
                        id="flow-email"
                        name="email"
                        required
                        autoComplete="email"
                        type="email"
                        placeholder="visitor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={pending}
                    />

                    <SystemButton data-text="action" context="flow" className="flow-button-full" type="submit" disabled={pending} aria-busy={pending}>
                        {pending ? "로그인 링크 전송 중…" : "이메일로 로그인 링크 받기"}
                    </SystemButton>

                    {recoveryResult && (
                        <SystemNotice data-text="body" variant="flow" className="flow-info-box" tabIndex={-1} style={{ marginTop: "1rem" }}>
                            {recoveryResult}
                        </SystemNotice>
                    )}

                    <div className="account-auth-links">
                        <Link data-text="action" href="/account/login">로그인</Link>
                        <Link data-text="action" href="/account/signup">회원가입</Link>
                    </div>
                </SystemSurface>
            </div>
        </div>
    );
}
