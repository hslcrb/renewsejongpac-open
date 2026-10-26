"use client";

import Icon from "../../../components/Icon";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SystemButton, SystemField, SystemNotice } from "../../../components/SystemPrimitives";
import { SystemSurface } from "../../../components/SystemSurface";
import { EmailSignupRequiredError, getGoogleOAuthAvailability, isSupabaseConfigured, requestEmailSignIn, signInWithGoogle } from "../../../src/lib/supabase.ts";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [emailPending, setEmailPending] = useState(false);
    const [googleStatus, setGoogleStatus] = useState<"checking" | "enabled" | "disabled" | "unavailable">("checking");
    const [oauthPending, setOauthPending] = useState(false);

    // [실제 제공자 설정 확인과 Google 로그인 / Runtime provider check and Google sign-in]
    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10_000);
        void getGoogleOAuthAvailability(controller.signal)
            .then(enabled => { if (mounted && !controller.signal.aborted) setGoogleStatus(enabled ? "enabled" : "disabled"); })
            .catch(() => { if (mounted) setGoogleStatus("unavailable"); })
            .finally(() => window.clearTimeout(timeout));
        return () => { mounted = false; controller.abort(); window.clearTimeout(timeout); };
    }, []);

    const handleGoogleSignIn = async () => {
        if (googleStatus !== "enabled" || oauthPending || emailPending) return;
        setErrorMessage("");
        setSuccessMessage("");
        setOauthPending(true);
        try { await signInWithGoogle(); }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Google 로그인 요청을 시작하지 못했습니다. 다시 시도해 주세요.");
            setOauthPending(false);
        }
    };

    // [이메일 소유 확인 후 로그인 / Sign in only after email ownership is verified]
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (emailPending || oauthPending) return;
        setErrorMessage("");
        setSuccessMessage("");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErrorMessage("유효한 이메일을 입력해 주세요.");
            return;
        }
        setEmailPending(true);
        try {
            await requestEmailSignIn(email.trim(), { createUser: false });
            setSuccessMessage("이메일로 로그인 링크를 보냈습니다.");
        } catch (error) {
            if (error instanceof EmailSignupRequiredError) {
                router.push(`/account/signup?email=${encodeURIComponent(email.trim())}`);
            } else {
                setErrorMessage("로그인 링크를 보내지 못했습니다. 이메일을 확인하고 잠시 후 다시 시도해 주세요.");
            }
        } finally {
            setEmailPending(false);
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
                        <span data-text="body" aria-current="page">로그인</span>
                    </nav>
                    <div className="page-title-row">
                        <div>
                            <h1 data-text="title">로그인</h1>
                            <p data-text="body" className="page-description">예매 내역과 관심 프로그램을 관리하는 페이지입니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container page-content flow-content">
                <div className="account-auth-layout">
                    <section className="account-auth-intro" aria-labelledby="account-intro-title">
                        <h2 data-text="heading" id="account-intro-title">
                            예매 내역과 관심 프로그램,
                            <br />
                            한곳에서 확인하세요.
                        </h2>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="account-auth-photo"
                            src="/v5/assets/images/sejong-grand-auditorium.png"
                            width={1160}
                            height={680}
                            alt="세종대극장의 객석"
                        />
                    </section>

                    <SystemSurface as="form" variant="panel" padding="lg" className="flow-panel" data-account-auth="login" onSubmit={handleSubmit} noValidate>
                        <h2 data-text="heading">로그인</h2>
                        <p data-text="body" className="flow-fineprint">
                            Google 계정 또는 이메일 로그인 링크로 본인 확인 후 이용하세요.
                        </p>

                        <SystemButton data-text="action" context="flow" variant="secondary" className="flow-button-full" type="button" onClick={handleGoogleSignIn}
                            disabled={googleStatus !== "enabled" || oauthPending || emailPending} aria-describedby="google-login-status" aria-busy={oauthPending}>
                            {oauthPending ? "Google로 이동 중…" : "Google로 계속하기"}
                        </SystemButton>
                        <p data-text="body" className="flow-fineprint" id="google-login-status" role="status" aria-live="polite">
                            {googleStatus === "checking" ? "Google 로그인 연결을 확인하고 있습니다."
                                : googleStatus === "enabled" ? "Google에서 본인 확인 후 마이페이지로 돌아옵니다."
                                : googleStatus === "unavailable" ? "로그인 서비스에 연결하지 못했습니다. 잠시 후 다시 접속해 주세요."
                                : isSupabaseConfigured ? "Google 로그인 연결을 사용할 수 없습니다. 이메일 로그인을 이용해 주세요."
                                : "현재 Google 로그인 연결을 준비하고 있습니다."}
                        </p>

                        <h3 data-text="subheading">이메일로 로그인</h3>
                        <p data-text="body" className="flow-fineprint">이메일을 입력해 주세요. 가입한 계정은 로그인 링크를 보내고, 처음이라면 회원가입으로 이어집니다.</p>

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
                            disabled={emailPending || oauthPending}
                        />

                        <SystemButton data-text="action" context="flow" className="flow-button-full" type="submit" disabled={emailPending || oauthPending} aria-busy={emailPending}>
                            {emailPending ? "로그인 링크 전송 중…" : "이메일로 로그인 링크 받기"}
                            <Icon name="arrow" size={20} />
                        </SystemButton>

                        {successMessage && <SystemNotice data-text="body" variant="flow" className="flow-info-box">{successMessage} 받은 이메일의 링크를 열어 주세요.</SystemNotice>}

                        <div className="account-auth-links">
                            <Link data-text="action" href="/account/signup">회원가입</Link>
                            <Link data-text="action" href="/account/recovery">계정 찾기</Link>
                        </div>
                    </SystemSurface>
                </div>
            </div>
        </div>
    );
}
