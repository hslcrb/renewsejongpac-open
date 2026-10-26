import { supabase } from "./supabase.ts";
import { authenticatedMember, MEMBER_TABLES } from "./account-db.ts";

// [DB가 기준인 관심 공연 / Favorites are backed by the member database]
const EMPTY: readonly string[] = Object.freeze([]);
let snapshot: readonly string[] = EMPTY;
let identity = "";
let generation = 0;
let started = false;
let loading: Promise<void> = Promise.resolve();
let mutations: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
const notify = () => listeners.forEach(listener => listener());

export function parseFavorites(raw: string | null): readonly string[] {
    try {
        const ids: unknown = JSON.parse(raw || "[]");
        return Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map(id => id.trim()))] : EMPTY;
    } catch { return EMPTY; }
}
export const serverFavorites = () => EMPTY;
export const getFavoriteIds = () => snapshot;

async function loadFavorites(id: string, version: number) {
    if (!supabase || !id) return;
    const { data, error } = await supabase.from(MEMBER_TABLES.favorites).select("program_id").eq("user_id", id);
    if (error) throw new Error("관심 프로그램을 불러오지 못했습니다.");
    if (generation !== version || identity !== id) return;
    snapshot = data.map(row => row.program_id);
    notify();
}

function start() {
    if (started || typeof window === "undefined") return;
    started = true;
    const changeIdentity = (id: string) => {
        const version = ++generation;
        identity = id;
        snapshot = EMPTY;
        notify();
        loading = loadFavorites(id, version);
        void loading.catch(() => {});
    };
    supabase?.auth.onAuthStateChange((_event, session) => { if ((session?.user.id || "") !== identity) changeIdentity(session?.user.id || ""); });
    const version = generation;
    void supabase?.auth.getSession().then(({ data }) => { if (version === generation) changeIdentity(data.session?.user.id || ""); });
    if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("sejong-member-favorites");
        channel.onmessage = () => { loading = loadFavorites(identity, generation); void loading.catch(() => {}); };
    }
}

export function subscribeFavorites(listener: () => void) {
    listeners.add(listener);
    start();
    return () => { listeners.delete(listener); };
}

export async function toggleFavorite(id: string) {
    start();
    const owner = identity;
    const version = generation;
    const assertOwner = () => {
        if (!owner) throw new Error("로그인한 뒤 관심 프로그램을 저장해 주세요.");
        if (identity !== owner || generation !== version) throw new Error("로그인한 계정이 변경되었습니다.");
    };
    const run = async () => {
        assertOwner();
        try { await loading; }
        catch {
            assertOwner();
            loading = loadFavorites(owner, version);
            await loading;
        }
        assertOwner();
        const { client, user } = await authenticatedMember();
        assertOwner();
        if (owner !== user.id) throw new Error("로그인 상태를 확인한 뒤 다시 눌러 주세요.");
        const saved = !snapshot.includes(id);
        const result = saved
            ? await client.from(MEMBER_TABLES.favorites).upsert({ user_id: user.id, program_id: id }, { onConflict: "user_id,program_id" })
            : await client.from(MEMBER_TABLES.favorites).delete().eq("user_id", user.id).eq("program_id", id);
        if (result.error) throw new Error("관심 프로그램을 저장하지 못했습니다. 다시 시도해 주세요.");
        assertOwner();
        snapshot = saved ? [...snapshot, id] : snapshot.filter(value => value !== id);
        notify();
        channel?.postMessage("updated");
        return { saved, persisted: true };
    };
    const result = mutations.then(run, run);
    mutations = result.then(() => undefined, () => undefined);
    return result;
}
