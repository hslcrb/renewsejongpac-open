/**
 * [공통 모델 라우터 / Provider-neutral chat completions]
 * Provider keys are available only inside the Supabase Edge Function runtime.
 */
export type Provider = "auto" | "groq" | "mistral";
export type ChatLine = { role: "user" | "ai"; text: string };
export type RoutedReply = { text: string; provider: "groq" | "mistral"; model: string };

type Backend = {
    name: "groq" | "mistral";
    key: string;
    endpoint: string;
    model: string;
};
const BACKENDS: readonly Omit<Backend, "key" | "model">[] = [
    { name: "groq", endpoint: "https://api.groq.com/openai/v1/chat/completions" },
    { name: "mistral", endpoint: "https://api.mistral.ai/v1/chat/completions" },
];
const DEFAULT_MODELS = { groq: "llama-3.3-70b-versatile", mistral: "mistral-small-latest" } as const;
const SYSTEM_PROMPT = [
    "너는 세종문화회관 비공식 리뉴얼 사이트의 친절한 AI 상담 도우미다.",
    "한국어로 핵심부터 정확하고 간결하게 답하라. 다른 언어 질문에는 같은 언어로 답해도 된다.",
    "현재 공연 일정, 예매 가능 여부, 티켓 가격, 할인, 휴관 및 주차 정보는 실시간 조회하지 않는다.",
    "변경될 수 있는 사실은 추측하여 확정적으로 말하지 말고 공식 세종문화회관 사이트 확인을 안내하라.",
    "본 사이트는 비공식 리뉴얼 데모임을 명확히 인지하고, 실제 결제나 개인정보 제공을 유도하지 마라.",
].join(" ");

export class RouterError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

function configuredBackend(name: "groq" | "mistral"): Backend | null {
    const key = Deno.env.get(name === "groq" ? "GROQ_API_KEY" : "MISTRAL_API_KEY") || "";
    if (!key) return null;
    const model = Deno.env.get(name === "groq" ? "CHAT_GROQ_MODEL" : "CHAT_MISTRAL_MODEL")
        || DEFAULT_MODELS[name];
    const endpoint = BACKENDS.find(item => item.name === name)!.endpoint;
    return { name, key, endpoint, model };
}

async function askBackend(backend: Backend, messages: ChatLine[]): Promise<RoutedReply> {
    const request = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(message => ({
            role: message.role === "ai" ? "assistant" : "user",
            content: message.text,
        })),
    ];
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 25000);
    try {
        const response = await fetch(backend.endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${backend.key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: backend.model, messages: request, temperature: 0.4,
                max_tokens: 700, stream: false,
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            console.warn("Chat backend unavailable", backend.name, response.status);
            throw new RouterError("모델 제공자에 연결하지 못했습니다.", response.status);
        }
        const data: unknown = await response.json();
        const choices = data && typeof data === "object" && "choices" in data
            ? (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices : undefined;
        const text = choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) throw new RouterError("빈 AI 응답입니다.", 502);
        return { text: text.trim().slice(0, 10000), provider: backend.name, model: backend.model };
    } finally {
        clearTimeout(deadline);
    }
}

export async function routeChat(messages: ChatLine[], preference: Provider): Promise<RoutedReply> {
    const order: Array<"groq" | "mistral"> = preference === "auto" ? ["groq", "mistral"] : [preference];
    const providers = order.map(configuredBackend).filter((item): item is Backend => Boolean(item));
    if (!providers.length) throw new RouterError("사용 가능한 AI 제공자가 없습니다.", 503);
    for (const [index, provider] of providers.entries()) {
        try {
            return await askBackend(provider, messages);
        } catch (error) {
            if (index === providers.length - 1) {
                throw new RouterError(error instanceof RouterError && error.status === 429
                    ? "모델 제공자 이용 한도에 도달했습니다." : "AI 모델 연결이 일시적으로 불안정합니다.", 502);
            }
        }
    }
    throw new RouterError("응답 모델을 찾지 못했습니다.", 503);
}
