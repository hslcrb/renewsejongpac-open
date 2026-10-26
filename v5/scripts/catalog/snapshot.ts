import { fileURLToPath } from "node:url";
import { createCatalogRepository } from "../../src/catalog/repository.ts";
import { writeCatalogSnapshot } from './snapshot-file.ts';

// Build must fail closed if DB cannot be read; never silently regenerate from legacy imports.
const repository = createCatalogRepository(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const snapshot = await repository.loadPublishedCatalog();
const target = fileURLToPath(new URL("../../src/generated/catalog-snapshot.json", import.meta.url));
const changed = await writeCatalogSnapshot(target, snapshot);
console.log(`Published catalog: ${snapshot.programs.length} programs, ${snapshot.pages.length} pages (${changed ? 'updated' : 'unchanged'}).`);
