"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveAccountIdentity, supabase } from "../src/lib/supabase.ts";
import type { AccountIdentitySnapshot } from "../src/lib/supabase.ts";
import { loadMemberProfile, saveMemberProfile } from "../src/lib/account-db.ts";
import type { UserProfile } from "../types/sejong.ts";
import type { User } from "@supabase/supabase-js";

// [인증 세션만 신뢰하는 회원 정보 / Member identity comes only from an authenticated session]
export const readAccountIdentity = (user: User | null, _storage?: unknown) => resolveAccountIdentity(user);
let pendingAccountMutation: Promise<unknown> = Promise.resolve();
export function queueAccountMutation<T>(run: () => Promise<T>): Promise<T> {
    const result = pendingAccountMutation.then(run, run);
    pendingAccountMutation = result.then(() => undefined, () => undefined);
    return result;
}

export default function useAccountIdentity() {
    const [identity, setIdentity] = useState<AccountIdentitySnapshot>({ ...resolveAccountIdentity(null), mode: "loading", ready: false });
    const currentUser = useRef<User | null>(null);
    const revision = useRef(0);
    const applyUser = useCallback((user: User | null) => {
        if (currentUser.current?.id !== user?.id) revision.current += 1;
        currentUser.current = user;
        setIdentity(current => {
            const next = resolveAccountIdentity(user);
            return user && current.identityId === user.id
                ? { ...next, profile: { ...current.profile, email: next.profile.email } }
                : next;
        });
    }, []);

    useEffect(() => {
        let mounted = true;
        let changes = 0;
        const subscription = supabase?.auth.onAuthStateChange((event, session) => {
            changes += 1;
            if (mounted && !(event === "USER_UPDATED" && session?.user.id !== currentUser.current?.id)) applyUser(session?.user || null);
        });
        const started = changes;
        if (supabase) void supabase.auth.getSession().then(({ data, error }) => {
            if (mounted && started === changes) applyUser(error ? null : data.session?.user || null);
        }).catch(() => { if (mounted && started === changes) applyUser(null); });
        else applyUser(null);
        return () => { mounted = false; subscription?.data.subscription.unsubscribe(); };
    }, [applyUser]);

    useEffect(() => {
        if (!identity.isLoggedIn) return;
        let cancelled = false;
        const owner = identity.identityId;
        const started = revision.current;
        void loadMemberProfile(owner).then(profile => {
            if (profile && !cancelled && revision.current === started && currentUser.current?.id === owner) setIdentity(current => ({ ...current, profile }));
        }).catch(() => { /* 인증 제공자의 DB 프로필은 유지 / Retain the authenticated provider profile. */ });
        return () => { cancelled = true; };
    }, [identity.identityId, identity.isLoggedIn]);

    const logout = useCallback(async () => {
        revision.current += 1;
        return queueAccountMutation(async () => {
            if (supabase) {
                const { error } = await supabase.auth.signOut();
                if (error) throw new Error("로그아웃하지 못했습니다. 다시 시도해 주세요.");
            }
            applyUser(null);
        });
    }, [applyUser]);

    const updateProfile = useCallback(async (profile: UserProfile) => {
        const next = { name: profile.name.trim(), email: profile.email.trim(), phone: profile.phone.trim() };
        const user = currentUser.current;
        if (!user || !supabase) throw new Error("로그인한 뒤 회원정보를 변경해 주세요.");
        if (!next.name || next.email !== user.email) throw new Error("이름과 로그인한 이메일을 확인해 주세요.");
        const started = ++revision.current;
        return queueAccountMutation(async () => {
            if (revision.current !== started || currentUser.current?.id !== user.id) throw new Error("로그인한 계정이 변경되었습니다.");
            await saveMemberProfile(next, user.id);
            if (revision.current !== started || currentUser.current?.id !== user.id) throw new Error("로그인한 계정이 변경되었습니다.");
            if (revision.current === started && currentUser.current?.id === user.id) setIdentity(current => ({ ...current, profile: next }));
        });
    }, []);
    return { ...identity, logout, updateProfile };
}
