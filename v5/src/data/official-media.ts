import { CATALOG_SNAPSHOT } from "../catalog/snapshot.ts";
import type { CatalogMedia } from "../catalog/types.ts";
export const OFFICIAL_MEDIA: Record<string, CatalogMedia> = Object.fromEntries(CATALOG_SNAPSHOT.media.map(media => [media.id, media]));
export type OfficialMediaId = string;
export const officialImage = (id: OfficialMediaId) => OFFICIAL_MEDIA[id] ? "assets/images/official/" + OFFICIAL_MEDIA[id].file : "";
export const officialImageAlt = (id: OfficialMediaId) => OFFICIAL_MEDIA[id]?.alt || "";
