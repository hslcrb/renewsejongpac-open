import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import snapshot from '../src/generated/catalog-snapshot.json' with { type: 'json' };

test('live refresh cannot introduce links to programs, venues, notices or pages absent from the static export', async () => {
    const target = new URL('../src/catalog/static-routes.ts', import.meta.url);
    assert.ok(existsSync(target), 'static route refresh boundary must be implemented');
    const { limitCatalogToExport } = await import(target.href);
    const next = structuredClone(snapshot);
    next.programs.push({ ...next.programs[0], id: 'new-program' });
    next.venues.push({ ...next.venues[0], id: 'new-venue' });
    next.notices.push({ ...next.notices[0], id: 'new-notice' });
    next.pages.push({ ...next.pages[0], path: '/new-page' });
    next.homeFeatures.push({ ...next.homeFeatures[0], id: 'new-program' });
    next.sessions.push({ ...next.sessions[0], id: 'new-session', programId: 'new-program' });
    const filtered = limitCatalogToExport(next, snapshot);
    assert.equal(filtered.programs.some(item => item.id === 'new-program'), false);
    assert.equal(filtered.venues.some(item => item.id === 'new-venue'), false);
    assert.equal(filtered.notices.some(item => item.id === 'new-notice'), false);
    assert.equal(filtered.pages.some(item => item.path === '/new-page'), false);
    assert.equal(filtered.homeFeatures.some(item => item.id === 'new-program'), false);
    assert.equal(filtered.sessions.some(item => item.programId === 'new-program'), false);
});

test('unpublishing all featured programs produces an empty hero without reviving old data', async () => {
    const target = new URL('../src/catalog/static-routes.ts', import.meta.url);
    assert.ok(existsSync(target), 'static route refresh boundary must be implemented');
    const { limitCatalogToExport } = await import(target.href);
    const filtered = limitCatalogToExport({ ...snapshot, programs: [] }, snapshot);
    assert.deepEqual(filtered.programs, []);
    assert.deepEqual(filtered.homeFeatures, []);
    assert.deepEqual(filtered.sessions, []);
});
