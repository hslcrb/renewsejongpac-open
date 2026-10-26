import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import { chromium } from 'playwright';
import { restoreReadableDocument } from '../src/runtime/readable-dom.ts';
import { finalizeReadableExport } from '../scripts/readable-finalize.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, '.lemonade/readable-fixture');
fs.mkdirSync(path.join(fixture, 'app/other'), { recursive: true });
fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ type: 'module', dependencies: { next: '14.2.35', react: '18.3.1', 'react-dom': '18.3.1' } }));
fs.writeFileSync(path.join(fixture, 'next.config.mjs'), `import { configureReadableBuild } from '../../scripts/readable-build.ts';\nexport default { output: 'export', basePath: '/v5', trailingSlash: true, productionBrowserSourceMaps: true, swcMinify: false, generateBuildId: async () => 'r-0123456789abcdef', webpack: (config, context) => configureReadableBuild(config, context, 'r-0123456789abcdef', ${JSON.stringify(root)}) };\n`);
fs.writeFileSync(path.join(fixture, 'app/layout.tsx'), `import './style.css'; export default function Layout({ children }) { return <html lang="en"><body><header><h1>Readable fixture</h1></header>{children}<footer><p>Footer</p></footer></body></html>; }`);
fs.writeFileSync(path.join(fixture, 'app/style.css'), `body { margin: 0; color: #123456; font: 16px Arial; } main { padding: 24px; } p { margin: 12px 0; }`);
fs.writeFileSync(path.join(fixture, 'app/page.tsx'), `'use client'; import {useState} from 'react'; import Link from 'next/link'; export default function Page(){const [count,setCount]=useState(0);const [value,setValue]=useState('');return <main id="main" className="test"><section><p>Hello <em>world</em> and <strong>friends</strong>!</p><pre> a{'\\n'}  b </pre><textarea aria-label="Exact text" defaultValue={' a\\n b '}/><div><button onClick={()=>setCount(count+1)}>Count {count}</button></div><form onSubmit={e=>{e.preventDefault();setValue('submitted')}}><input name="name" aria-label="Name"/><button type="submit">Submit</button><output>{value}</output></form><div><Link href="/other/">Other page</Link></div></section></main>}`);
fs.writeFileSync(path.join(fixture, 'app/other/page.tsx'), `import Link from 'next/link'; export default function Other(){return <main><h2>Other route</h2><Link href="/">Home page</Link></main>}`);
if (!process.argv.includes('--skip-build')) {
    const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], { cwd: fixture, encoding: 'utf8', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync(path.join(fixture, 'build.log'), result.stdout + result.stderr);
    assert.equal(result.status, 0, result.stdout + result.stderr);
}
const out = path.join(fixture, 'out');
for (const relative of ['index.html', 'other/index.html', '404.html', '404/index.html']) {
    const originalPath = path.join(out, relative + (process.argv.includes('--skip-build') ? '.original' : ''));
    const original = fs.readFileSync(fs.existsSync(originalPath) ? originalPath : path.join(out, '404.html.original'), 'utf8');
    fs.writeFileSync(path.join(out, relative + '.original'), original);
    fs.writeFileSync(path.join(out, relative), original);
}
const readableManifest = finalizeReadableExport(fixture, root);
assert.equal(readableManifest.schemaVersion, 1);
assert.ok(readableManifest.assets.every(asset => asset.bytes > 0 && asset.gzipBytes > 0 && asset.sourceFiles.length > 0));
const stylesheet = readableManifest.assets.find(asset => asset.kind === 'css')!;
assert.match(fs.readFileSync(path.join(out, stylesheet.path), 'utf8'), /\n    margin: 0;/);
const cssMap = JSON.parse(fs.readFileSync(path.join(out, stylesheet.path + '.map'), 'utf8'));
assert.ok(cssMap.sources.some((source: string) => source.endsWith('/app/style.css')), 'CSS map must resolve the original source stylesheet');
const originalHtml = fs.readFileSync(path.join(out, 'index.html.original'), 'utf8');
const server = http.createServer((request, response) => {
    let relative = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname).replace(/^\/v5\/?/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    let file = path.join(out, relative);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file.startsWith(out) || !fs.existsSync(file)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.map') ? 'application/json' : 'text/html');
    response.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address() as { port: number };
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const report: Record<string, unknown> = {};
try {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const original = await context.newPage();
    const formatted = await context.newPage();
    await original.goto(origin + '/v5/index.html.original');
    await formatted.goto(origin + '/v5/');
    const snapshot = () => [...document.querySelectorAll('body *')].filter(node => !['SCRIPT'].includes(node.tagName)).map(node => ({ tag: node.tagName, text: (node as HTMLElement).innerText, rect: JSON.stringify(node.getBoundingClientRect().toJSON()) }));
    assert.deepEqual(await formatted.evaluate(snapshot), await original.evaluate(snapshot), 'JavaScript-disabled visual geometry and displayed text must match');
    report.javascriptDisabled = 'same text and geometry';
    await context.close();
    const check = await browser.newPage();
    await check.route('**/*.js', route => route.abort());
    await check.goto(origin + '/v5/');
    await check.evaluate('(' + restoreReadableDocument.toString() + ')(document)');
    const signature = await check.evaluate(html => {
        function sign(node: Node): unknown { return [node.nodeType, node.nodeName, node.nodeType === 1 ? [...(node as Element).attributes].map(attr => [attr.name, attr.value]) : node.nodeValue, [...node.childNodes].map(sign)]; }
        return { actual: sign(document), expected: sign(new DOMParser().parseFromString(html, 'text/html')) };
    }, originalHtml);
    assert.deepEqual(signature.actual, signature.expected, 'Restored DOM must match compiled HTML exactly');
    report.domRestoration = 'exact elements, attributes, text and comments';
    await check.close();
    for (const slow of [false, true]) {
        const page = await browser.newPage();
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        if (slow) await page.route('**/*.js', async route => { await new Promise(resolve => setTimeout(resolve, 200)); await route.continue(); });
        await page.goto(origin + '/v5/');
        await page.getByRole('button', { name: 'Count 0' }).click();
        await page.getByRole('button', { name: 'Count 1' }).waitFor();
        await page.getByLabel('Name', { exact: true }).fill('test');
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        await page.locator('output').filter({ hasText: 'submitted' }).waitFor();
        await page.getByRole('link', { name: 'Other page' }).click();
        await page.getByRole('heading', { name: 'Other route' }).waitFor();
        await page.reload();
        await page.getByRole('heading', { name: 'Other route' }).waitFor();
        await page.getByRole('link', { name: 'Home page' }).click();
        await page.getByRole('button', { name: 'Count 0' }).waitFor();
        assert.deepEqual(errors, [], `Hydration/browser errors (${slow ? 'slow' : 'fast'})`);
        report[slow ? 'slowJavascript' : 'fastJavascript'] = 'hydration, form, client navigation and direct reload pass';
        await page.close();
    }
    const assets = JSON.parse(fs.readFileSync(path.join(fixture, '.next/readable-webpack-manifest.json'), 'utf8'));
    assert.ok(Object.keys(assets.assets).some(name => name.endsWith('/app/page_1.js')));
    assert.ok(Object.keys(assets.assets).some(name => name.endsWith('.css')));
    report.assetCount = Object.keys(assets.assets).length;
    fs.writeFileSync(path.join(fixture, 'proof.json'), JSON.stringify(report, null, 4));
    console.log(JSON.stringify(report, null, 4));
} finally { await browser.close(); server.close(); }
