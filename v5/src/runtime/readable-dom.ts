type WhitespaceChange = { path: number[]; childIndex: number; original: string | null; formatted: string };

/** Restore only formatter-recorded text nodes, before the first React hydrate. */
export function restoreReadableDocument(document: Document): void {
    const helper = document.getElementById('__readable_whitespace__');
    if (!helper) return;
    const manifest = JSON.parse(helper.textContent || '{}') as { schemaVersion: number; changes: WhitespaceChange[] };
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.changes)) throw new Error('Unsupported readable HTML manifest');
    // Resolve all addresses before removing a node shifts any child index.
    const targets = manifest.changes.map(change => {
        let parent: Document | Element = document;
        for (const index of change.path) parent = parent.children[index];
        const node = parent.childNodes[change.childIndex];
        if (!node || node.nodeType !== 3 || node.textContent !== change.formatted) throw new Error('Readable HTML whitespace differs from its build manifest: ' + JSON.stringify({ path: change.path, childIndex: change.childIndex, actual: node?.textContent, expected: change.formatted }));
        return { node, original: change.original };
    });
    for (const { node, original } of targets) {
        if (original === null) node.parentNode!.removeChild(node);
        else node.textContent = original;
    }
    helper.remove();
}
