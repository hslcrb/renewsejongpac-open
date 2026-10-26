import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

test('formatter preserves mixed text and raw bodies while indenting structural HTML', async () => {
    const moduleUrl = new URL('../scripts/readable-html.ts', import.meta.url);
    assert.ok(existsSync(moduleUrl), 'readable HTML formatter must be implemented');
    const { formatReadableHtml } = await import(moduleUrl.href);
    const original = '<!DOCTYPE html><html lang="ko"><head><title>A &amp; B</title></head><body><main id="main" class="layout"><section><p>Hello <em>world</em>!</p><pre> a\n  b </pre><textarea> x\n y </textarea><!--$--><div><span>nested</span></div><!--/$--></section></main><script>self.__next_f.push([1," x\\n "])</script></body></html>';
    const formatted = formatReadableHtml(original);
    assert.match(formatted, /\n    <head>/);
    assert.match(formatted, /\n        <main\n            id="main"\n            class="layout"\n        >/);
    for (const raw of ['<p>Hello <em>world</em>!</p>', '<pre> a\n  b </pre>', '<textarea> x\n y </textarea>', '<!--$-->', 'self.__next_f.push([1," x\\n "])']) assert.ok(formatted.includes(raw), raw);
    assert.match(formatted, /id="__readable_whitespace__"/);
});

test('formatter keeps original spaces, React boundaries, and template bodies available for exact restoration', async () => {
    const { formatReadableHtml } = await import('../scripts/readable-html.ts');
    const original = '<!DOCTYPE html><html><head></head><body>\n <main> \n <div><!--$--><p>A <span> B </span> C</p><!--/$--></div>\n </main><template><div>  untouched\n </div></template></body>\n</html>';
    const formatted = formatReadableHtml(original);
    assert.ok(formatted.includes('<p>A <span> B </span> C</p>'));
    assert.ok(formatted.includes('<template><div>  untouched\n </div></template>'));
    assert.ok(formatted.includes('"original":" \\n "'));
});
