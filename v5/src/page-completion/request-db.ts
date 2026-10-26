import { supabase } from "../lib/supabase.ts";
import { createClient } from "@supabase/supabase-js";
import type { ServiceCartLine, ServiceGood, ServiceRequest, ServiceValues } from "./requests.ts";

// [본인 확인 후 서버에서 저장 / Server persistence after authenticated ownership checks]
async function clientFor(owner: string) {
    if (!supabase) throw new Error("신청 서비스에 연결하지 못했습니다.");
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;
    if (sessionResult.error || !session || session.user.id !== owner) throw new Error("로그인한 계정을 확인한 뒤 다시 시도해 주세요.");
    const { data, error } = await supabase.auth.getUser(session.access_token);
    if (error || !data.user || data.user.id !== owner) throw new Error("로그인한 계정을 확인한 뒤 다시 시도해 주세요.");
    // 비동기 요청 중 계정이 바뀌어도 새 계정의 토큰으로 보내지 않습니다. / Bind each operation to its verified session token.
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
}
function result<T>({ data, error }: { data: T; error: { message: string } | null }): T {
    if (error) throw new Error(error.message || "저장하지 못했습니다. 다시 시도해 주세요.");
    return data;
}
export async function loadServiceRequests(owner: string, formId?: string): Promise<ServiceRequest[]> {
    const client = await clientFor(owner);
    let query = client.from("sejong_service_requests").select("id,reference,form_id,kind,status,values,created_at,expires_at").order("created_at", { ascending: false }).limit(50);
    if (formId) query = query.eq("form_id", formId);
    return result(await query) as ServiceRequest[];
}
export async function submitServiceRequest(owner: string, formId: string, key: string, values: ServiceValues): Promise<ServiceRequest> {
    const client = await clientFor(owner);
    return result(await client.rpc("submit_sejong_request", { p_form_id: formId, p_request_key: key, p_values: values })) as ServiceRequest;
}
export async function cancelServiceRequest(owner: string, id: string): Promise<ServiceRequest> {
    const client = await clientFor(owner);
    return result(await client.rpc("cancel_sejong_request", { p_id: id })) as ServiceRequest;
}
export async function loadServiceGoods(): Promise<ServiceGood[]> {
    if (!supabase) throw new Error("상품 목록에 연결하지 못했습니다.");
    return result(await supabase.from("sejong_service_goods").select("id,title,description,source_url,image,price").eq("published", true).order("sort_order")) as ServiceGood[];
}
export async function loadServiceCart(owner: string): Promise<ServiceCartLine[]> {
    const client = await clientFor(owner);
    const rows = result(await client.from("sejong_service_cart").select("good_id,quantity,sejong_service_goods(id,title,description,source_url,image,price)").order("updated_at")) || [];
    return rows.map(row => ({ good_id: row.good_id, quantity: row.quantity, sejong_goods: row.sejong_service_goods as unknown as ServiceGood }));
}
export async function setServiceCartQuantity(owner: string, goodId: string, quantity: number, increment = false) {
    const client = await clientFor(owner);
    result(await client.rpc("set_sejong_cart_quantity", { p_good_id: goodId, p_quantity: quantity, p_increment: increment }));
}
