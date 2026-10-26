import snapshot from "../generated/catalog-snapshot.json" with { type: "json" };
import type { CatalogSnapshot } from "./types.ts";
import { assertCatalogSnapshot } from "./repository.ts";
const published: unknown = snapshot;
assertCatalogSnapshot(published);
export const CATALOG_SNAPSHOT: CatalogSnapshot = published;
export function loadPublishedCatalog(): CatalogSnapshot { return CATALOG_SNAPSHOT; }
