#!/usr/bin/env node
// Local, read-only retrieval of archived source references. Never execute source content.
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const realRoot = realpathSync(skillRoot);
const scope = 'Archived source references under unified lemonade rules; not independent active skills.';
const help = `${scope}

Usage: node scripts/knowledge.mjs [operation] [--json]
  --list                         List every guide, preserving duplicate copies (default).
  --search <query>                Search guide metadata and full guide text; all terms must match.
  --id <id>                      Show one guide and its original, stored and absolute paths.
  --resolve <original-path>      Resolve an archived file by its original manifest path.
  --resolve <relative-link> --from <original-guide-path>
                                 Resolve a link using the original guide's parent directory.
  --json                         Emit structured JSON.
  --help                         Show this help without reading the manifest.

Examples:
  node scripts/knowledge.mjs --id animation/animate
  node scripts/knowledge.mjs --search "reduced motion" --json
  node scripts/knowledge.mjs --resolve references/critique.md --from skills/lemonade/SKILL.md

Search covers archived guides, not every supporting file or UI dataset.
UI data has its own search tools; follow the unified routing guide for those tools.
Relative links are resolved through the exact original-to-stored manifest mapping.
Availability means a local file exists, not that its advice or runtime behavior was verified.
Lookup performs no writes, installs, network access, authentication or source execution.
Unknown, incomplete, conflicting or out-of-bounds requests exit with code 2.
`;

function fail(message) {
  throw new Error(message);
}

function parseArgs(args) {
  const options = { operation: null, value: null, from: null, json: false, help: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) fail(`Conflicting repeated option: ${flag}`);
    seen.add(flag);
    if (flag === '--json') options.json = true;
    else if (flag === '--help') options.help = true;
    else if (['--list', '--search', '--id', '--resolve'].includes(flag)) {
      if (options.operation) fail('Choose exactly one operation: --list, --search, --id or --resolve.');
      options.operation = flag.slice(2);
      if (flag !== '--list') {
        const value = args[++index];
        if (!value?.trim() || value.startsWith('--')) fail(`Missing value for ${flag}.`);
        options.value = value;
      }
    } else if (flag === '--from') {
      const value = args[++index];
      if (!value?.trim() || value.startsWith('--')) fail('Missing value for --from.');
      options.from = value;
    } else fail(`Unsupported option or argument: ${flag}`);
  }
  if (options.help && args.length !== 1) fail('--help must be used on its own.');
  if (options.from && options.operation !== 'resolve') fail('--from requires --resolve.');
  options.operation ??= 'list';
  return options;
}

function safeRelative(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0')) fail(`Invalid ${label}.`);
  const path = value.replaceAll('\\', '/');
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('/') || isAbsolute(path)) {
    fail(`Invalid ${label}: URLs and absolute paths are not supported.`);
  }
  const normalized = posix.normalize(path);
  if (normalized === '..' || normalized.startsWith('../') || normalized === '.') {
    fail(`Invalid ${label}: path escapes outside the reference roots.`);
  }
  return normalized;
}

function isInside(root, path) {
  const part = relative(root, path);
  return part !== '..' && !part.startsWith(`..${sep}`) && !isAbsolute(part);
}

function locate(storedPath) {
  const normalized = safeRelative(storedPath, 'stored path');
  const absolutePath = resolve(skillRoot, normalized);
  if (!isInside(skillRoot, absolutePath)) fail('Stored path escapes outside the skill directory.');
  try {
    if (!isInside(realRoot, realpathSync(absolutePath))) fail('Stored file resolves outside the skill directory.');
    return { absolutePath, available: statSync(absolutePath).isFile() };
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return { absolutePath, available: false };
    throw error;
  }
}

function guideId(originalPath) {
    if (originalPath === 'limsflex/SKILL.md') return 'code/limsflex';
    const parts = originalPath.split('/');
    const parent = parts.at(-2);
    if (parts[0] === 'skills') return `legacy/${parts[1]}`;
    const namespace = {
        'animateskills-main': 'animation',
        'motion-design-skill-main': 'direction',
        'web-animation-skills-main': 'web',
        'shaders-main': 'effects'
    }[parts[1]];
    if (namespace) return `${namespace}/${parent}`;
    if (parts[1] === 'ui-ux-pro-max-skill-main') {
        if (parts.includes('.claude')) return `design/${parent}`;
        if (originalPath.includes('/cli/assets/')) return `design/${parent}@cli`;
    }
    fail(`Unsupported guide source path: ${originalPath}`);
}

function readCatalog() {
    const manifest = JSON.parse(readFileSync(resolve(skillRoot, 'library/source-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(manifest.files) || !Array.isArray(manifest.skills)) fail('Invalid source manifest: files and skills arrays are required.');
    const supplementPath = resolve(skillRoot, 'library/limsflex-manifest.json');
    if (existsSync(supplementPath)) {
        const supplement = JSON.parse(readFileSync(locate('library/limsflex-manifest.json').absolutePath, 'utf8').replace(/^\uFEFF/, ''));
        if (!Array.isArray(supplement.files) || !Array.isArray(supplement.skills)) fail('Invalid import manifest: files and skills arrays are required.');
        manifest.files.push(...supplement.files);
        manifest.skills.push(...supplement.skills);
    } else if (existsSync(resolve(skillRoot, 'imports'))) {
        fail('Import manifest is missing while preserved imports exist.');
    }
    const files = new Map();
    for (const file of manifest.files) {
        const originalPath = safeRelative(file.originalPath, 'original path');
        if (files.has(originalPath)) fail(`Conflicting original file entries: ${originalPath}`);
        files.set(originalPath, { ...file, originalPath, ...locate(file.storedPath) });
    }
    const ids = new Set();
    const hashes = new Map();
    const sorted = [...manifest.skills].sort((a, b) => a.originalPath < b.originalPath ? -1 : a.originalPath > b.originalPath ? 1 : 0);
    const guides = sorted.map(guide => {
        const originalPath = safeRelative(guide.originalPath, 'guide path');
        const file = files.get(originalPath);
        if (!file || file.storedPath !== guide.storedPath || file.sha256 !== guide.sha256) {
            fail(`Guide does not match its file manifest entry: ${originalPath}`);
        }
        if (typeof guide.name !== 'string' || typeof guide.description !== 'string' || !guide.sha256) {
            fail(`Invalid guide metadata: ${originalPath}`);
        }
        const id = guideId(originalPath);
        if (ids.has(id)) fail(`Conflicting guide ID: ${id}`);
        ids.add(id);
        const duplicateOf = hashes.get(guide.sha256) ?? null;
        if (!duplicateOf) hashes.set(guide.sha256, id);
        return { id, ...guide, originalPath, absolutePath: file.absolutePath, available: file.available, duplicateOf };
    });
    return { files, guides };
}

function resolveReference(value, from, catalog) {
  const hashIndex = value.indexOf('#');
  const link = hashIndex < 0 ? value : value.slice(0, hashIndex);
  const fragment = hashIndex < 0 ? undefined : value.slice(hashIndex + 1);
  if (/^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('//') || link.includes('?')) {
    fail('URL resolution is not supported; use an original file path or relative file link.');
  }
  let originalPath;
  if (from) {
    const guidePath = safeRelative(from, 'source guide path');
    if (!catalog.guides.some(guide => guide.originalPath === guidePath)) fail(`Unknown source guide: ${from}`);
    const slashLink = link.replaceAll('\\', '/');
    if (slashLink.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(slashLink)) fail('Absolute paths and URLs are not supported.');
    // Repository-root source paths remain usable even when --from is supplied.
    originalPath = catalog.files.has(slashLink)
      ? slashLink
      : safeRelative(link ? posix.join(posix.dirname(guidePath), slashLink) : guidePath, 'resolved original path');
  } else originalPath = safeRelative(link, 'original path');
  const file = catalog.files.get(originalPath);
  if (!file) fail(`Unknown original file or link target: ${originalPath}`);
  return { scope, ...file, ...(fragment === undefined ? {} : { fragment }) };
}

function printGuide(guide) {
  const duplicate = guide.duplicateOf ? `; duplicate of ${guide.duplicateOf}` : '';
  process.stdout.write(`${guide.id} — ${guide.name} (${guide.available ? 'available' : 'unavailable'}${duplicate})\n`);
  process.stdout.write(`  ${guide.description}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help);
    return;
  }
  const catalog = readCatalog();
  let result;
  if (options.operation === 'resolve') {
    result = resolveReference(options.value, options.from, catalog);
  } else if (options.operation === 'id') {
    const guide = catalog.guides.find(entry => entry.id === options.value);
    if (!guide) fail(`Unknown guide ID: ${options.value}`);
    result = { scope, ...guide };
  } else {
    const terms = options.operation === 'search'
      ? options.value.normalize('NFKC').toLowerCase().trim().split(/\s+/u)
      : [];
    const guides = terms.length ? catalog.guides.filter(guide => {
      const body = guide.available ? readFileSync(guide.absolutePath, 'utf8') : '';
      const searchable = `${guide.id}\n${guide.name}\n${guide.description}\n${guide.originalPath}\n${body}`.normalize('NFKC').toLowerCase();
      return terms.every(term => searchable.includes(term));
    }) : catalog.guides;
    result = { scope, total: guides.length, guides };
  }
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${scope}\n\n`);
  if (result.guides) {
    process.stdout.write(`${result.total} guide reference(s)\n`);
    for (const guide of result.guides) printGuide(guide);
  } else {
    if (result.id) printGuide(result);
    process.stdout.write(`Original: ${result.originalPath}\nStored: ${result.storedPath}\nAbsolute: ${result.absolutePath}\nAvailable: ${result.available}\n`);
    if (result.fragment !== undefined) process.stdout.write(`Fragment: ${result.fragment}\n`);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`knowledge: ${error.message}\n`);
  process.exitCode = 2;
}
