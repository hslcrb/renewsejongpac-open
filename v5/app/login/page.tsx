"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/account/login");
    }, [router]);

    return (
        <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
            <p data-text="body">로그인 페이지로 이동 중입니다...</p>
        </div>
    );
}
