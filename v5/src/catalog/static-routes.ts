import type { CatalogSnapshot } from './types.ts';

/** Keep live content inside the routes emitted by this static release. */
export function limitCatalogToExport(next: CatalogSnapshot, exported: CatalogSnapshot): CatalogSnapshot {
    const existing = <T extends { id: string }>(incoming: T[], built: T[]): T[] => {
        const known = new Set(built.map(item => item.id));
        return incoming.filter(item => known.has(item.id));
    };
    const programs = existing(next.programs, exported.programs);
    const publishedPrograms = new Set(programs.map(item => item.id));
    const knownPages = new Set(exported.pages.map(item => item.path));
    return {
        ...next,
        programs,
        venues: existing(next.venues, exported.venues),
        companies: existing(next.companies, exported.companies),
        notices: existing(next.notices, exported.notices),
        pages: next.pages.filter(item => knownPages.has(item.path)),
        homeFeatures: existing(next.homeFeatures, exported.homeFeatures).filter(item => publishedPrograms.has(item.id)),
        sessions: next.sessions.filter(item => publishedPrograms.has(item.programId)),
    };
}
