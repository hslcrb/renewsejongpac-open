"use client";

import Icon from "../../../components/Icon";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { SystemButton, SystemCheckbox, SystemField, SystemNotice } from "../../../components/SystemPrimitives";
import { SystemSurface } from "../../../components/SystemSurface";
import { requestEmailSignIn } from "../../../src/lib/supabase.ts";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [consent, setConsent] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [pending, setPending] = useState(false);
    const [continuedFromLogin, setContinuedFromLogin] = useState(false);
    const nameField = useRef<HTMLInputElement>(null);

    // [로그인에서 이어받은 이메일 / Continue with the email entered at login]
    useEffect(() => {
        const loginEmail = new URLSearchParams(window.location.search).get("email")?.trim();
        if (loginEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
            setEmail(loginEmail);
            setContinuedFromLogin(true);
            nameField.current?.focus();
        }
    }, []);

    // [이메일 인증으로 만드는 계정 / Create an account through email verification]
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (pending) return;
        setErrorMessage("");
        setSuccessMessage("");

        if (!name.trim()) {
            setErrorMessage("이름을 입력해 주세요.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErrorMessage("유효한 이메일을 입력해 주세요.");
            return;
        }
        if (!consent) {
            setErrorMessage("개인정보 수집 및 이용에 동의해 주세요.");
            return;
        }

        setPending(true);
        try {
            await requestEmailSignIn(email.trim(), { createUser: true, name: name.trim(), phone: phone.trim() });
            setSuccessMessage("이메일로 로그인 링크를 보냈습니다.");
        } catch {
            setErrorMessage("가입 링크를 보내지 못했습니다. 이메일을 확인하고 잠시 후 다시 시도해 주세요.");
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
                        <span data-text="body" aria-current="page">회원가입</span>
                    </nav>
                    <div className="page-title-row">
                        <div>
                            <h1 data-text="title">회원가입</h1>
                            <p data-text="body" className="page-description">이메일을 확인하고 나의 공간과 관람노트를 이용하세요.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container page-content flow-content">
                <div className="account-auth-layout">
                    <section className="account-auth-intro" aria-labelledby="account-intro-title">
                        <h2 data-text="heading" id="account-intro-title">
                            나만의 공간에서
                            <br />
                            다음 관람을 준비해요.
                        </h2>
                        <p data-text="body">관심 가는 프로그램을 모으고, 다음 관람을 준비해 보세요.</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="account-auth-photo"
                            src="/v5/assets/images/sejong-grand-auditorium.png"
                            width={1160}
                            height={680}
                            alt="세종대극장의 객석"
                        />
                    </section>

                    <SystemSurface as="form" variant="panel" padding="lg" className="flow-panel" data-account-auth="signup" onSubmit={handleSubmit} noValidate>
                        <h2 data-text="heading">회원가입</h2>
                        <p data-text="body" className="flow-fineprint">
                            가입할 이메일로 보낸 링크를 열면 계정을 사용할 수 있습니다.
                        </p>
                        <p data-text="body" className="flow-fineprint">이미 가입했다면 <Link data-text="action" href="/account/login">로그인</Link>을 이용하세요.</p>

                        {continuedFromLogin && <SystemNotice data-text="body" variant="flow">입력한 이메일로 회원가입을 이어갑니다. 이름을 입력하고 필수 동의를 확인해 주세요.</SystemNotice>}

                        {errorMessage && (
                            <SystemNotice data-text="body" variant="flow" error className="flow-error" id="flow-error" tabIndex={-1}>
                                {errorMessage}
                            </SystemNotice>
                        )}

                        <SystemField data-text="body"
                            ref={nameField}
                            variant="flow"
                            outerClassName="form-field"
                            label={<>이름 <span data-text="body" className="flow-required" aria-hidden="true">*</span>
                                <span data-text="body" className="sr-only">필수</span></>}
                            id="flow-name"
                            name="name"
                            required
                            autoComplete="name"
                            maxLength={40}
                            type="text"
                            placeholder="이름을 입력해 주세요"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={pending}
                        />

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
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={pending}
                        />

                        <SystemField data-text="body"
                            variant="flow"
                            outerClassName="form-field"
                            label={<>연락처 <span data-text="body" className="flow-optional">(선택)</span></>}
                            id="flow-phone"
                            name="phone"
                            autoComplete="tel"
                            type="tel"
                            placeholder="010-0000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={pending}
                        />

                        <SystemCheckbox data-text="label"
                            className="flow-consent"
                            label={<span data-text="body">회원가입을 위한 개인정보 수집 및 이용에 동의합니다. <strong data-text="item-title">(필수)</strong></span>}
                            name="consent"
                            required
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            disabled={pending}
                        />

                        <SystemButton data-text="action" context="flow" className="flow-button-full" type="submit" disabled={pending} aria-busy={pending}>
                            {pending ? "가입 링크 전송 중…" : "이메일로 가입 링크 받기"}
                            <Icon name="arrow" size={20} />
                        </SystemButton>

                        {successMessage && <SystemNotice data-text="body" variant="flow" className="flow-info-box">{successMessage} 받은 이메일의 링크를 열어 가입을 완료해 주세요.</SystemNotice>}

                        <div className="account-auth-links">
                            <Link data-text="action" href="/account/login">로그인으로 돌아가기</Link>
                        </div>
                    </SystemSurface>
                </div>
            </div>
        </div>
    );
}
