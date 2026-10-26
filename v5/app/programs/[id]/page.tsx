import React from "react";
import { notFound } from "next/navigation";
import { PAGES, PROGRAMS } from "../../../src/data/catalog";
import { loadPublishedCatalog } from "../../../src/catalog/snapshot";
import type { Program } from "../../../types/sejong.ts";
import ProgramDetailClient from "./ProgramDetailClient";
import CatalogDynamicPage from "../../[...slug]/page";

export function generateStaticParams() {
    const ids = new Set([
        ...loadPublishedCatalog().programs.map(program => String(program.id)),
        ...PAGES.filter(page => /^\/programs\/[^/]+$/.test(page.path)).map(page => page.path.split("/").at(-1)!),
    ]);
    return [...ids].map(id => ({ id }));
}

export default function ProgramDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const program = loadPublishedCatalog().programs.find((p) => String(p.id) === params.id);
    if (!program) {
        // [안내 분류가 작품 상세 경로에 가려지지 않도록 / Keep registered categories reachable]
        if (PAGES.some(page => page.path === `/programs/${params.id}`)) return <CatalogDynamicPage params={{ slug: ["programs", params.id] }} />;
        notFound();
    }

    return <ProgramDetailClient program={program} />;
}
