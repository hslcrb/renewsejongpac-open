import React from "react";
import { notFound } from "next/navigation";
import { loadPublishedCatalog } from "../../../src/catalog/snapshot";
import type { Program } from "../../../types/sejong.ts";
import BookingClient from "./BookingClient";

export function generateStaticParams() {
    return loadPublishedCatalog().programs.map((p) => ({
        id: String(p.id),
    }));
}

export default function BookingPage({
    params,
}: {
    params: { id: string };
}) {
    const program = loadPublishedCatalog().programs.find((p) => String(p.id) === params.id);
    if (!program) notFound();

    return <BookingClient program={program} />;
}
