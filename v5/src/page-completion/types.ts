// [완성 페이지의 DB 직렬화 계약 / Serializable database contract for completed pages]
export type ServiceKind = "rental" | "group" | "inquiry" | "partnership" | "donation" | "recruitment" | "event" | "newsletter" | "membership" | "education" | "order";
export type CompletionImage = { src: string; alt: string; caption?: string };
export type CompletionCard = {
    id: string; title: string; href: string; description?: string; meta?: string;
    category?: string; image?: CompletionImage; date?: string; status?: string;
};
export type CompletionSection =
    | { type: "prose"; title: string; paragraphs: string[] }
    | { type: "facts"; title: string; items: { label: string; value: string }[] }
    | { type: "table"; title: string; columns: string[]; rows: string[][]; note?: string }
    | { type: "timeline"; title: string; items: { date: string; title: string; body: string }[] }
    | { type: "faq"; title: string; items: { question: string; answer: string }[] }
    | { type: "links" | "downloads"; title: string; items: { label: string; href: string; description?: string }[] }
    | { type: "cards"; title: string; items: CompletionCard[]; searchable?: boolean; emptyMessage?: string }
    | { type: "image"; title: string; image: CompletionImage };
export type CompletionPage = {
    path: string; title: string; summary: string; sections: CompletionSection[];
    sources: { label: string; url: string }[];
    image?: CompletionImage;
    relatedPrograms?: { title: string; category?: string; tag?: string; query?: string };
    form?: { kind: ServiceKind; title: string; entityId?: string; description?: string; closed?: boolean; closedReason?: string };
    special?: "venue-compare" | "rental-calendar" | "goods" | "cart" | "orders" | "sitemap";
};
