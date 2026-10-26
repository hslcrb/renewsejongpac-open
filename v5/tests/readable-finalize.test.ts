import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { finalizeReadableExport } from '../scripts/readable-finalize.ts';

test('export provenance resolves dynamic and catch-all routes, Next fallback pages and copied public files to real sources', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'readable-provenance-'));
    const write = (file: string, body: string) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), body); };
    const json = (file: string, data: unknown) => write(file, JSON.stringify(data));
    try {
        write('app/programs/[id]/page.tsx', 'export default function Page() {}');
        write('app/[...slug]/page.tsx', 'export default function Page() {}');
        write('app/layout.tsx', 'export default function Layout() {}');
        write('node_modules/next/dist/client/components/not-found-error.js', 'exports.default = function NotFound() {}');
        write('public/assets/LICENSE.txt', 'Public asset license');
        write('out/assets/LICENSE.txt', 'Public asset license');
        for (const file of ['programs/test/index.html', 'about/history/index.html', '404.html']) write('out/' + file, '<!DOCTYPE html><html><head></head><body><main>Text</main></body></html>');
        write('out/_next/static/r-test/app/_not-found/page_1.js', '/* Generated entry */');
        json('.next/readable-webpack-manifest.json', { releaseId: 'r-test', assets: { 'static/r-test/app/_not-found/page_1.js': { sourceFiles: ['app/_not-found/page.tsx'], routes: ['app/_not-found/page'] } } });
        json('.next/server/app-paths-manifest.json', { '/programs/[id]/page': 'app/programs/[id]/page.js', '/[...slug]/page': 'app/[...slug]/page.js', '/_not-found/page': 'app/_not-found/page.js' });
        json('.next/app-path-routes-manifest.json', { '/programs/[id]/page': '/programs/[id]', '/[...slug]/page': '/[...slug]', '/_not-found/page': '/_not-found' });
        json('.next/prerender-manifest.json', { routes: { '/programs/test': { srcRoute: '/programs/[id]' }, '/about/history': { srcRoute: '/[...slug]' } } });
        const manifest = finalizeReadableExport(root);
        const sources = (file: string) => manifest.assets.find(asset => asset.path === file)!.sourceFiles;
        assert.ok(sources('programs/test/index.html').includes('app/programs/[id]/page.tsx'));
        assert.deepEqual(manifest.assets.find(asset => asset.path === 'programs/test/index.html')!.routes, ['/v5/programs/test/']);
        assert.ok(sources('about/history/index.html').includes('app/[...slug]/page.tsx'));
        assert.ok(sources('404.html').includes('node_modules/next/dist/client/components/not-found-error.js'));
        assert.deepEqual(sources('assets/LICENSE.txt'), ['public/assets/LICENSE.txt']);
        for (const asset of manifest.assets) for (const source of asset.sourceFiles) assert.ok(fs.existsSync(path.join(root, source)), source);
        const first = fs.readFileSync(path.join(root, 'out/programs/test/index.html'));
        finalizeReadableExport(root);
        assert.deepEqual(fs.readFileSync(path.join(root, 'out/programs/test/index.html')), first, 'Repeated postbuild preserves formatted HTML bytes');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
