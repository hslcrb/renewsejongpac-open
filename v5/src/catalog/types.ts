import type { Program, Venue, Notice } from "../../types/sejong.ts";

export type PageContentBlock =
    | { type: "prose"; heading?: string; paragraphs: string[] }
    | { type: "facts"; title?: string; items: { label: string; value: string }[] }
    | { type: "faq"; title?: string; items: { question: string; answer: string }[] }
    | { type: "timeline"; title?: string; items: { date: string; title: string; body?: string }[] }
    | { type: "map"; address: string; href: string; label: string }
    | { type: "downloads"; title?: string; items: { label: string; href: string }[] }
    | { type: "actions"; items: { label: string; href: string; external?: boolean }[] };
export interface PageContent { path: string; title: string; description: string; blocks: PageContentBlock[]; status?: "published" | "draft"; revision?: number; sourceUrl?: string; verifiedAt?: string; }
export interface ProgramSession { id: string; programId: string; venueId: string | null; startsAt: string; bookingEnabled: boolean; sourceState: "verified" | "unverified"; }
export interface HomeFeature { id: string; theme: string; label: string; title: string; name: string; programTitle: string; date: string; venue: string; image: string; alt: string; description: string; }
export interface TicketOpening { id: string; title: string; opensAt: string; href: string; }
export interface CatalogMedia { id: string; file: string; source: string; sourcePage: string; alt: string; sha256: string; }
export interface CatalogSnapshot {
    version: 1; generatedAt: string; programs: Program[]; venues: Venue[];
    companies: { id: string; name: string; description: string; genre: string }[];
    notices: Notice[]; homeFeatures: HomeFeature[]; ticketOpenings: TicketOpening[];
    media: CatalogMedia[]; sessions: ProgramSession[]; pages: PageContent[];
}
export interface CatalogRepository { loadPublishedCatalog(): Promise<CatalogSnapshot>; }
