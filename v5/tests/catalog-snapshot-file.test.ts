import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import snapshot from '../src/generated/catalog-snapshot.json' with { type: 'json' };

test('identical published data preserves snapshot bytes despite a new fetch timestamp or object key order', async () => {
    const moduleUrl = new URL('../scripts/catalog/snapshot-file.ts', import.meta.url);
    assert.ok(existsSync(moduleUrl), 'stable snapshot writer must exist');
    const { writeCatalogSnapshot } = await import(moduleUrl.href);
    const directory = mkdtempSync(path.join(os.tmpdir(), 'catalog-snapshot-'));
    const target = path.join(directory, 'snapshot.json');
    try {
        assert.equal(await writeCatalogSnapshot(target, snapshot), true);
        const first = readFileSync(target);
        const reordered = Object.fromEntries(Object.entries(snapshot).reverse());
        assert.equal(await writeCatalogSnapshot(target, { ...reordered, generatedAt: '2099-01-01T00:00:00Z' }), false);
        assert.deepEqual(readFileSync(target), first);
    } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('changed published data writes the new content and its new generation time', async () => {
    const moduleUrl = new URL('../scripts/catalog/snapshot-file.ts', import.meta.url);
    assert.ok(existsSync(moduleUrl), 'stable snapshot writer must exist');
    const { writeCatalogSnapshot } = await import(moduleUrl.href);
    const directory = mkdtempSync(path.join(os.tmpdir(), 'catalog-snapshot-'));
    const target = path.join(directory, 'snapshot.json');
    try {
        await writeCatalogSnapshot(target, snapshot);
        const changed = structuredClone(snapshot);
        changed.generatedAt = '2099-01-01T00:00:00Z';
        changed.programs[0].title = 'Changed published title';
        assert.equal(await writeCatalogSnapshot(target, changed), true);
        const actual = JSON.parse(readFileSync(target, 'utf8'));
        assert.equal(actual.generatedAt, '2099-01-01T00:00:00Z');
        assert.equal(actual.programs[0].title, 'Changed published title');
    } finally { rmSync(directory, { recursive: true, force: true }); }
});
