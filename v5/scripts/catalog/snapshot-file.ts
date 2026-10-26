import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogSnapshot } from '../../src/catalog/types.ts';

function ordered(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, ordered(item)]));
    return value;
}

function publishedContent(snapshot: CatalogSnapshot): string {
    const { generatedAt, ...content } = snapshot;
    return JSON.stringify(ordered(content));
}

/** A fresh query is not a new publication when the published content is equal. */
export async function writeCatalogSnapshot(target: string, next: CatalogSnapshot): Promise<boolean> {
    let previous: CatalogSnapshot | undefined;
    try {
        previous = JSON.parse(await readFile(target, 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (previous && typeof previous.generatedAt === 'string' && publishedContent(previous) === publishedContent(next)) return false;
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(next, null, 4) + '\n', 'utf8');
    return true;
}
