import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('release identity changes for runtime inputs but ignores previous build outputs', async () => {
    const moduleUrl = new URL('../scripts/readable-release.ts', import.meta.url);
    assert.ok(existsSync(moduleUrl), 'release fingerprint implementation must exist');
    const { calculateReleaseId } = await import(moduleUrl.href);
    const root = mkdtempSync(path.join(os.tmpdir(), 'readable-release-'));
    try {
        mkdirSync(path.join(root, 'app'));
        writeFileSync(path.join(root, 'app/page.tsx'), 'original');
        writeFileSync(path.join(root, 'package-lock.json'), '{"version":1}');
        const first = calculateReleaseId(root, { NEXT_PUBLIC_TEST: 'first' });
        assert.match(first, /^r-[a-f0-9]{16}$/);
        mkdirSync(path.join(root, 'out'));
        writeFileSync(path.join(root, 'out/index.html'), 'old output');
        assert.equal(calculateReleaseId(root, { NEXT_PUBLIC_TEST: 'first' }), first);
        assert.notEqual(calculateReleaseId(root, { NEXT_PUBLIC_TEST: 'second' }), first);
        writeFileSync(path.join(root, 'app/page.tsx'), 'changed');
        assert.notEqual(calculateReleaseId(root, { NEXT_PUBLIC_TEST: 'first' }), first);
    } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a stylesheet-only edit changes asset release URLs to prevent stale cached CSS', async () => {
    const { calculateReleaseId } = await import('../scripts/readable-release.ts');
    const root = mkdtempSync(path.join(os.tmpdir(), 'readable-release-css-'));
    try {
        mkdirSync(path.join(root, 'styles'));
        writeFileSync(path.join(root, 'styles/layout.css'), 'body { margin: 0; }');
        const first = calculateReleaseId(root, {});
        writeFileSync(path.join(root, 'styles/layout.css'), 'body { margin: 1px; }');
        assert.notEqual(calculateReleaseId(root, {}), first);
    } finally { rmSync(root, { recursive: true, force: true }); }
});
