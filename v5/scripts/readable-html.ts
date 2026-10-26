import { parse } from 'parse5';

// Source slices preserve React comments, entity spelling, Flight data and mixed
// inline content. Only structural whitespace and tag-attribute layout change.
const structural = new Set(['html', 'head', 'body', 'main', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'div', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'form', 'fieldset', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'colgroup', 'select', 'optgroup', 'details', 'dialog']);
const inline = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'button', 'code', 'em', 'i', 'img', 'input', 'label', 'small', 'span', 'strong', 'sub', 'sup', 'time']);
const protectedBodies = new Set(['pre', 'textarea', 'script', 'style', 'title', 'template', 'svg', 'math']);
type AstNode = any;
export type WhitespaceChange = { path: number[]; childIndex: number; original: string | null; formatted: string };
const children = (node: AstNode): AstNode[] => node.childNodes || [];
const elements = (node: AstNode): AstNode[] => children(node).filter(child => child.tagName);

export function formatReadableHtml(source: string): string {
    if (source.includes('id="__readable_whitespace__"')) throw new Error('HTML has already been formatted');
    const original = parse(source, { sourceCodeLocationInfo: true });
    function render(node: AstNode, depth: number): string {
        const loc = node.sourceCodeLocation;
        if (!node.tagName) return loc ? source.slice(loc.startOffset, loc.endOffset) : children(node).map(child => render(child, depth)).join('\n');
        if (!loc?.startTag) return children(node).map(child => render(child, depth)).join('');
        if (protectedBodies.has(node.tagName)) return source.slice(loc.startOffset, loc.endOffset);
        const indent = '    '.repeat(depth);
        let opening = source.slice(loc.startTag.startOffset, loc.startTag.endOffset);
        const attributes = Object.values(loc.attrs || {}) as { startOffset: number; endOffset: number }[];
        if (attributes.length > 1) opening = '<' + node.tagName + '\n' + attributes.map(attr => indent + '    ' + source.slice(attr.startOffset, attr.endOffset)).join('\n') + '\n' + indent + (opening.endsWith('/>') ? '/>' : '>');
        if (!loc.endTag) return opening;
        const closing = source.slice(loc.endTag.startOffset, loc.endTag.endOffset);
        const nodes = children(node);
        const canIndent = structural.has(node.tagName) && nodes.length > 0 && !nodes.some(child => child.nodeName === '#text' && /\S/.test(child.value)) && !nodes.some(child => inline.has(child.tagName));
        if (!canIndent) return opening + nodes.map(child => render(child, depth + 1)).join('') + closing;
        return opening + '\n' + nodes.filter(child => child.nodeName !== '#text').map(child => '    '.repeat(depth + 1) + render(child, depth + 1)).join('\n') + '\n' + indent + closing;
    }
    const helper = '<script id="__readable_whitespace__" type="application/json"></script>';
    const rendered = render(original, 0);
    const renderedAst: any = parse(rendered, { sourceCodeLocationInfo: true });
    const body = renderedAst.childNodes.find((node: any) => node.tagName === 'html').childNodes.find((node: any) => node.tagName === 'body');
    const insertion = body.sourceCodeLocation.startTag.endOffset;
    // Insert before the first body child. Inserting before </body> would split
    // the text node that HTML parsing merges with whitespace after </body>.
    const formatted = rendered.slice(0, insertion) + helper + rendered.slice(insertion);
    const parsed = parse(formatted);
    const isHelper = (node: AstNode) => node.tagName === 'script' && node.attrs?.some((attr: any) => attr.name === 'id' && attr.value === '__readable_whitespace__');
    const changes: WhitespaceChange[] = [];
    function compare(before: AstNode, after: AstNode, path: number[]) {
        const old = children(before);
        const fresh = children(after);
        let oldIndex = 0;
        fresh.forEach((child, childIndex) => {
            if (isHelper(child)) return;
            const previous = old[oldIndex];
            if (child.nodeName === '#text') {
                const originalText = previous?.nodeName === '#text' ? previous.value : null;
                if (originalText !== child.value) changes.push({ path, childIndex, original: originalText, formatted: child.value });
                if (originalText !== null) oldIndex++;
            } else {
                if (previous?.nodeName === '#text') throw new Error('Formatter removed an original text node');
                if (!previous || previous.nodeName !== child.nodeName) throw new Error('Formatter changed HTML structure');
                oldIndex++;
            }
        });
        if (oldIndex !== old.length) throw new Error('Formatter dropped HTML children');
        const beforeElements = elements(before);
        let elementIndex = 0;
        elements(after).forEach((child, index) => {
            if (!isHelper(child)) compare(beforeElements[elementIndex++], child, [...path, index]);
        });
    }
    compare(original, parsed, []);
    const data = JSON.stringify({ schemaVersion: 1, changes }).replaceAll('<', '\\u003c');
    return formatted.replace(helper, helper.replace('</script>', data + '</script>'));
}
