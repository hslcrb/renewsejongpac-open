import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { UserProfile } from "../../types/sejong.ts";

// [계정 식별과 체험 데이터 분리 / Account identity and demo data separation]
export type AccountMode = "loading" | "demo" | "oauth" | "guest";
export interface AccountIdentitySnapshot {
    profile: UserProfile;
    isLoggedIn: boolean;
    mode: AccountMode;
    ready: boolean;
    identityId: string;
}

export function resolveAccountIdentity(user: User | null, _storage: Pick<Storage, "getItem"> | null = null): AccountIdentitySnapshot {
    const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
    if (user?.id) {
        const metadata = user.user_metadata || {};
        return {
            profile: {
                name: text(metadata.full_name) || text(metadata.name) || text(user.email?.split("@")[0]) || "관람객",
                email: text(user.email), phone: text(metadata.phone) || text(user.phone),
            },
            isLoggedIn: true, mode: "oauth", ready: true, identityId: user.id,
        };
    }
    return { profile: { name: "", email: "", phone: "" }, isLoggedIn: false, mode: "guest", ready: true, identityId: "guest" };
}

// [체험 계정의 안정적인 식별자 / Stable local demo identity]
export function createDemoProfile(profile: UserProfile, previousRaw: string | null = null): UserProfile & { localId: string } {
    let previous: { email?: unknown; localId?: unknown } | null = null;
    try { previous = JSON.parse(previousRaw || "null"); } catch { /* 손상된 값은 새 계정으로 시작 / Start fresh for damaged storage. */ }
    const previousEmail = typeof previous?.email === "string" ? previous.email.trim().toLowerCase() : "";
    const previousId = typeof previous?.localId === "string" ? previous.localId.trim() : "";
    const localId = previousEmail && previousEmail === profile.email.trim().toLowerCase()
        ? previousId || previousEmail
        : globalThis.crypto?.randomUUID?.() || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return { ...profile, localId };
}

// [브라우저 공개 설정 검증 / Browser public configuration validation]
export function isPublicSupabaseKey(key: string): boolean {
    if (key.startsWith("sb_publishable_")) return true;
    if (key.startsWith("sb_secret_")) return false;
    try {
        const payload = key.split(".")[1];
        return JSON.parse(globalThis.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role === "anon";
    } catch {
        return false;
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    isPublicSupabaseKey(supabaseAnonKey) &&
    supabaseUrl !== "https://your-project-id.supabase.co"
);

// Supabase 클라이언트 싱글톤 인스턴스 (설정값이 있을 때만 활성화)
export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: false,
              flowType: "pkce",
          },
      })
    : null;

// [고정 OAuth 복귀 경로와 제공자 상태 / Fixed OAuth callback and provider availability]
export function getAccountCallbackUrl(origin: string): string {
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
        throw new Error("로그인을 시작한 사이트 주소를 확인해 주세요.");
    }
    return new URL("/v5/account/callback/", url.origin).href;
}

export function isGoogleOAuthEnabled(settings: unknown): boolean {
    return Boolean(settings && typeof settings === "object" && "external" in settings &&
        settings.external && typeof settings.external === "object" &&
        "google" in settings.external && settings.external.google === true);
}

export async function getGoogleOAuthAvailability(signal?: AbortSignal): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseAnonKey }, signal, cache: "no-store",
    });
    if (!response.ok) throw new Error("로그인 서비스 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return isGoogleOAuthEnabled(await response.json());
}

// [소셜 로그인과 세션 / Social sign-in and sessions]
export async function signInWithOAuthProvider(
    provider: "google" | "kakao" | "github" = "google",
    redirectTo?: string
) {
    if (!supabase) {
        throw new Error("Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인해 주세요.");
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = getAccountCallbackUrl(origin);
    // A caller-supplied URL cannot turn this helper into an open redirect.
    if (redirectTo && new URL(redirectTo, origin).origin !== origin) {
        throw new Error("다른 사이트로 이동하는 로그인 요청은 사용할 수 없습니다.");
    }
    const targetUrl = callbackUrl;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: targetUrl,
        },
    });

    if (error) throw error;
    return data;
}

export async function signInWithGoogle(redirectTo?: string) {
    return signInWithOAuthProvider("google", redirectTo);
}

// [이메일 소유 확인을 거친 실제 로그인 / Real sign-in after verifying email ownership]
export class EmailSignupRequiredError extends Error {
    constructor() {
        super("입력한 이메일로 회원가입을 이어가 주세요.");
        this.name = "EmailSignupRequiredError";
    }
}

export async function requestEmailSignIn(email: string, options: { createUser?: boolean; name?: string; phone?: string } = {}) {
    if (!supabase) throw new Error("로그인 서비스에 연결하지 못했습니다.");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: {
        shouldCreateUser: options.createUser === true,
        emailRedirectTo: getAccountCallbackUrl(window.location.origin),
        ...(options.createUser ? { data: { name: options.name?.trim(), full_name: options.name?.trim(), phone: options.phone?.trim() } } : {}),
    } });
    if (error) {
        // 다른 전송 오류를 미등록 계정으로 해석하지 않음 / Do not treat other delivery errors as missing accounts.
        if (options.createUser !== true && error.code === "otp_disabled" && error.message === "Signups not allowed for otp") {
            throw new EmailSignupRequiredError();
        }
        throw new Error("로그인 링크를 보내지 못했습니다. 이메일 주소를 확인하고 잠시 후 다시 시도해 주세요.");
    }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * 현재 로그인된 사용자 정보 취득
 */
export async function getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return () => subscription.unsubscribe();
}
