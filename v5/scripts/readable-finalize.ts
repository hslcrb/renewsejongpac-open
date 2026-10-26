import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'parse5';
import { formatReadableHtml } from './readable-html.ts';

type SourceRecord = { sourceFiles: string[]; routes: string[] };
type Asset = SourceRecord & { path: string; kind: string; bytes: number; gzipBytes: number };

export function finalizeReadableExport(root: string, sourceRoot: string = root, { write = true }: { write?: boolean } = {}): { schemaVersion: number; releaseId: string; assets: Asset[] } {
    const out = path.join(root, 'out');
    const compilation = JSON.parse(fs.readFileSync(path.join(root, '.next/readable-webpack-manifest.json'), 'utf8')) as { releaseId: string; assets: Record<string, SourceRecord> };
    const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const appPaths: Record<string, string> = readJson('.next/server/app-paths-manifest.json');
    const appRoutes: Record<string, string> = readJson('.next/app-path-routes-manifest.json');
    const prerender: { routes: Record<string, { srcRoute: string | null }> } = readJson('.next/prerender-manifest.json');
    const relativeSource = (file: string) => path.relative(sourceRoot, file).replaceAll('\\', '/');
    const sourceExists = (source: string) => fs.existsSync(path.join(sourceRoot, source)) && fs.statSync(path.join(sourceRoot, source)).isFile();
    const notFoundSource = 'node_modules/next/dist/client/components/not-found-error.js';
    const routeFromFile = (file: string) => '/' + file.replace(/(?:^|\/)index\.(?:html|txt)$/, '').replace(/\.(?:html|txt)$/, '').replace(/\/$/, '');
    function routeSources(route: string): string[] {
        let primary: string | undefined;
        if (route === '/404' || route === '/_not-found') primary = notFoundSource;
        else {
            const sourceRoute = prerender.routes[route]?.srcRoute || route;
            const entry = Object.keys(appRoutes).find(key => appRoutes[key] === sourceRoute && appPaths[key]);
            if (entry) {
                for (const extension of ['tsx', 'ts', 'jsx', 'js']) {
                    const file = path.join(root, 'app' + entry + '.' + extension);
                    if (fs.existsSync(file)) { primary = relativeSource(file); break; }
                }
            }
        }
        if (!primary) throw new Error('No actual application source for exported route: ' + route);
        const layout = relativeSource(path.join(root, 'app/layout.tsx'));
        return [...new Set([primary, ...(sourceExists(layout) ? [layout] : [])])].sort();
    }
    function canonicalSource(source: string, asset: string): string {
        const converted = source.replace(/^vendor\//, 'node_modules/');
        if (source.startsWith('app/') && fs.existsSync(path.join(root, source))) return relativeSource(path.join(root, source));
        if (sourceExists(converted)) return converted;
        if (source === 'app/_not-found/page.tsx') return notFoundSource;
        if (source === 'runtime/pages/_app') return 'node_modules/next/dist/pages/_app.js';
        if (source === 'runtime/pages/_error') return 'node_modules/next/dist/pages/_error.js';
        if (source === 'runtime/webpack') return 'node_modules/next/dist/compiled/webpack/webpack.js';
        if (source === 'runtime/next-build-manifest') return 'node_modules/next/dist/build/webpack/plugins/build-manifest-plugin.js';
        throw new Error('No actual module source for ' + asset + ': ' + source);
    }
    function generatedSources(file: string): string[] {
        const publicFile = path.join(root, 'public', file);
        if (fs.existsSync(publicFile)) return [relativeSource(publicFile)];
        if (/\.(?:html|txt)$/.test(file)) return routeSources(routeFromFile(file));
        return [canonicalSource(file.includes('/runtime/webpack_') ? 'runtime/webpack' : 'runtime/next-build-manifest', file)];
    }
    const files: string[] = [];
    function walk(relative: string): void {
        for (const name of fs.readdirSync(path.join(out, relative)).sort()) {
            const child = path.posix.join(relative, name);
            if (fs.statSync(path.join(out, child)).isDirectory()) walk(child);
            else files.push(child);
        }
    }
    walk('');
    const formattedHtml = new Map<string, Buffer>();
    const routeAssets = new Map<string, Set<string>>();
    for (const file of files.filter(file => file.endsWith('.html'))) {
        const original = fs.readFileSync(path.join(out, file), 'utf8');
        const route = '/v5' + routeFromFile(file) + (routeFromFile(file) === '/' ? '' : '/');
        const document = parse(original);
        function visit(node: any): void {
            for (const attr of node.attrs || []) {
                if (['src', 'href'].includes(attr.name) && attr.value.startsWith('/v5/_next/')) {
                    const asset = attr.value.slice('/v5/'.length).split('?')[0];
                    if (!routeAssets.has(asset)) routeAssets.set(asset, new Set());
                    routeAssets.get(asset)!.add(route);
                }
            }
            for (const child of node.childNodes || []) visit(child);
        }
        visit(document);
        if (!original.includes('id="__readable_whitespace__"')) {
            const formatted = Buffer.from(formatReadableHtml(original));
            formattedHtml.set(file, formatted);
            if (write) fs.writeFileSync(path.join(out, file), formatted);
        }
    }
    const assets: Asset[] = [];
    const seen = new Set<string>();
    for (const file of files) {
        if (!/\.(?:js|css|map|html|txt)$/.test(file)) continue;
        if (seen.has(file.toLowerCase())) throw new Error('Case-insensitive output filename collision: ' + file);
        seen.add(file.toLowerCase());
        const bytes = formattedHtml.get(file) || fs.readFileSync(path.join(out, file));
        const key = file.replace(/^_next\//, '');
        const metadata = compilation.assets[key] || compilation.assets[key.replace(/\.map$/, '')];
        const sourceFiles = [...new Set(metadata?.sourceFiles.length ? metadata.sourceFiles.map(source => canonicalSource(source, file)) : generatedSources(file))].sort();
        for (const source of sourceFiles) if (!sourceExists(source)) throw new Error('Export provenance references a missing source: ' + source);
        if (file.endsWith('.map')) {
            const map = JSON.parse(bytes.toString());
            for (const source of map.sources || []) {
                if (/^(?:[A-Za-z]:[\\/]|\/|file:)/.test(source) || /webpack:\/\/[^/]*\/[A-Za-z]:/.test(source)) throw new Error('Absolute source path in public source map: ' + file);
            }
        }
        const routes = new Set(routeAssets.get(file) || routeAssets.get(file.replace(/\.map$/, '')) || []);
        if (/\.(?:html|txt)$/.test(file) && !fs.existsSync(path.join(root, 'public', file))) {
            const route = routeFromFile(file);
            routes.add('/v5' + route + (route === '/' ? '' : '/'));
        }
        for (const entry of metadata?.routes || []) {
            if (entry === '*') { routes.add('*'); continue; }
            const sourceRoute = appRoutes['/' + entry.replace(/^app\//, '')];
            if (sourceRoute === '/_not-found') { routes.add('/v5/404/'); continue; }
            for (const [route, details] of Object.entries(prerender.routes)) if ((details.srcRoute || route) === sourceRoute) routes.add('/v5' + route + (route === '/' ? '' : '/'));
        }
        assets.push({ path: file, kind: file.endsWith('.map') ? 'source-map' : path.extname(file).slice(1), sourceFiles, routes: [...routes].sort(), bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
    }
    const manifest = { schemaVersion: 1, releaseId: compilation.releaseId, assets };
    if (write) fs.writeFileSync(path.join(out, 'readable-assets.json'), JSON.stringify(manifest, null, 4) + '\n');
    return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = finalizeReadableExport(root);
    console.log(`Readable export ${result.releaseId}: ${result.assets.length} assets, formatted HTML and public source maps verified.`);
}
