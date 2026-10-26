#!/usr/bin/env node
// lemonade / draw — deal an art direction from the research library.
//
// The script chooses, not the model: a model asked to pick a direction returns the category
// default every time. The draw is random within what fits the brief, and it remembers recent
// draws so consecutive projects do not look alike.
//
//   node draw.mjs --sector <sector> --brief "one line" [--sections hero,showcase,pricing,footer]
//                 [--tone quiet|bold|warm|technical|playful|luxury|editorial]
//                 [--have photography,product-photo,product-ui,illustration,video]   assets you really have
//                 [--keep palette,type]        the brand already fixes these; draw the rest
//                 [--avoid id,id] [--seed N] [--out DIR]
//                 [--options 3]                show three dealt directions to choose from, write nothing
//                 [--direction <id>]           deal the full sheet for the chosen direction
//   node draw.mjs --show                       reprint the saved direction sheet
//   node draw.mjs --redraw hero|type|palette|photos|section:<role>|direction   re-deal one slot
//   node draw.mjs --list sectors|directions|roles|tones
//   node draw.mjs --site <id>                  print one studied reference site in full
//
// Zero dependencies. Node 18+.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', 'library');
const ASSETS_PATH = join(HERE, 'assets.mjs').split('\\').join('/');
const ASSETS_CMD = `node ${/\s/.test(ASSETS_PATH) ? `"${ASSETS_PATH}"` : ASSETS_PATH}`;
const load = (name) => JSON.parse(readFileSync(join(LIB, name + '.json'), 'utf8'));

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); if (i === -1) return def; const v = argv[i + 1]; return v === undefined || v.startsWith('--') ? true : v; };
const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const outDir = resolve(String(opt('out', '.lemonade')));
const sheetPath = join(outDir, 'direction.json');

const SECTORS = ['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance', 'agency', 'studio-portfolio', 'personal-portfolio', 'ecommerce', 'physical-product', 'fashion', 'hospitality', 'restaurant', 'real-estate', 'architecture', 'event', 'health', 'education', 'nonprofit', 'culture', 'music', 'other'];
const TONES = ['quiet', 'bold', 'warm', 'technical', 'playful', 'luxury', 'editorial'];
const DEFAULT_SECTIONS = {
  saas: ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  'dev-tool': ['hero', 'showcase', 'features', 'how-it-works', 'pricing', 'faq', 'cta', 'footer'],
  'ai-product': ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'cta', 'footer'],
  'consumer-app': ['hero', 'showcase', 'features', 'testimonial', 'cta', 'footer'],
  finance: ['hero', 'showcase', 'features', 'stats', 'testimonial', 'faq', 'cta', 'footer'],
  agency: ['hero', 'intro', 'work', 'services', 'about', 'cta', 'footer'],
  'studio-portfolio': ['hero', 'work', 'intro', 'services', 'about', 'cta', 'footer'],
  'personal-portfolio': ['hero', 'work', 'about', 'cta', 'footer'],
  ecommerce: ['hero', 'gallery', 'features', 'intro', 'testimonial', 'cta', 'footer'],
  'physical-product': ['hero', 'showcase', 'features', 'gallery', 'intro', 'pricing', 'cta', 'footer'],
  fashion: ['hero', 'gallery', 'intro', 'work', 'cta', 'footer'],
  hospitality: ['hero', 'intro', 'gallery', 'features', 'list', 'contact', 'footer'],
  restaurant: ['hero', 'intro', 'list', 'gallery', 'contact', 'footer'],
  'real-estate': ['hero', 'intro', 'gallery', 'features', 'stats', 'contact', 'footer'],
  architecture: ['hero', 'work', 'intro', 'about', 'contact', 'footer'],
  event: ['hero', 'intro', 'list', 'features', 'pricing', 'faq', 'cta', 'footer'],
  health: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'faq', 'cta', 'footer'],
  education: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  nonprofit: ['hero', 'intro', 'stats', 'features', 'about', 'cta', 'footer'],
  culture: ['hero', 'intro', 'gallery', 'list', 'about', 'cta', 'footer'],
  music: ['hero', 'list', 'gallery', 'about', 'cta', 'footer'],
  other: ['hero', 'intro', 'features', 'showcase', 'cta', 'footer'],
};
// requested role names → the role vocabulary used by library/sections.json
const ROLE_ALIAS = { features: 'features', feature: 'features', benefits: 'features', services: 'features', showcase: 'showcase', product: 'showcase', demo: 'showcase', 'how-it-works': 'how-it-works', how: 'how-it-works', process: 'how-it-works', steps: 'how-it-works', testimonial: 'testimonial', testimonials: 'testimonial', quotes: 'testimonial', proof: 'proof', logos: 'proof', press: 'proof', stats: 'stats', numbers: 'stats', pricing: 'pricing', plans: 'pricing', faq: 'faq', cta: 'cta', footer: 'footer', intro: 'intro', manifesto: 'intro', about: 'about', team: 'about', work: 'work', projects: 'work', index: 'work', 'case-studies': 'work', gallery: 'gallery', images: 'gallery', list: 'list', menu: 'list', schedule: 'list', lineup: 'list', 'line-up': 'list', speakers: 'list', agenda: 'list', programme: 'list', program: 'list', timetable: 'list', rooms: 'list', tickets: 'pricing', price: 'pricing', contact: 'contact', booking: 'contact', newsletter: 'contact', signup: 'contact' };

if (opt('list')) {
  const what = opt('list');
  if (what === 'sectors') console.log(SECTORS.join('\n'));
  else if (what === 'tones') console.log(TONES.join('\n'));
  else if (what === 'roles') console.log([...new Set(Object.values(ROLE_ALIAS))].join('\n'));
  else for (const d of load('directions')) console.log(`${d.id.padEnd(30)} ${d.name} — ${d.sectors.join(', ')}`);
  process.exit(0);
}
if (opt('photos')) {
  const lib = load('photos'); const q = String(opt('photos'));
  const line = (ph) => `- https://picsum.photos/id/${ph.id}/1600/1000 — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · photo: ${ph.by}`;
  if (q === 'list' || q === 'true') { for (const [id, set] of Object.entries(lib.sets)) console.log(`${id.padEnd(22)} ${String(set.photos.length).padStart(3)} photos — ${set.note}`); }
  else if (lib.sets[q]) { console.log(`# ${lib.sets[q].title} — ${lib.sets[q].note}`); for (const ph of lib.sets[q].photos) console.log(line(ph)); }
  else { // free-text search across all descriptions
    const words = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 3);
    const hits = Object.values(lib.sets).flatMap((s) => s.photos).filter((ph) => words.some((w) => (ph.alt + ' ' + (ph.colours || []).join(' ')).toLowerCase().includes(w)));
    if (!hits.length) console.log('No photograph matches. `--photos list` shows the sets.'); else for (const ph of hits.slice(0, 24)) console.log(line(ph));
  }
  console.log('\nPath numbers are width/height; add ?grayscale to desaturate. Photographs are atmosphere, never a stand-in for a specific product or person.');
  process.exit(0);
}
if (opt('site')) {
  const s = load('sites').find((x) => x.id === opt('site') || x.name.toLowerCase() === String(opt('site')).toLowerCase());
  if (!s) { console.error('No studied site with that id. Ids appear in the direction sheet under "Real references".'); process.exit(2); }
  console.log(siteCard(s, true)); process.exit(0);
}

// ---------- randomness (seedable) ----------
let seed = opt('seed') !== undefined && opt('seed') !== true ? Number(opt('seed')) : randomInt(1, 2 ** 31 - 1);
const startSeed = seed;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// prefer items not used recently, without ever emptying the pool
const fresh = (pool, recent) => { const f = pool.filter((x) => !recent.includes(x.id)); return f.length ? f : pool; };

// ---------- history (project + user level) ----------
const userHist = process.env.LEMONADE_HISTORY || join(homedir(), '.lemonade', 'history.json');
const readHist = () => { for (const p of [userHist]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch {} } return []; };
const writeHist = (entry) => { try { mkdirSync(dirname(userHist), { recursive: true }); const h = readHist(); h.unshift(entry); writeFileSync(userHist, JSON.stringify(h.slice(0, 24), null, 1)); } catch {} };

// ---------- show / redraw ----------
const saved = existsSync(sheetPath) ? JSON.parse(readFileSync(sheetPath, 'utf8')) : null;
if (opt('show')) {
  if (!saved) { console.error('No saved direction. Run a draw first.'); process.exit(2); }
  console.log(render(saved)); process.exit(0);
}

const L = { directions: load('directions'), heroes: load('heroes'), sections: load('sections'), type: load('type'), palettes: load('palettes'), photos: load('photos'), sites: load('sites'), motions: load('motions') };
const hist = readHist();
const recent = (key, n) => hist.slice(0, n).map((h) => h[key]).filter(Boolean);

let sheet;
if (opt('alternatives')) {
  // The other blueprints of one role that suit the saved direction: for when the dealt one cannot hold
  // the real content (it assumes three plans and there is one; it needs five quotes and there are none).
  if (!saved) { console.error('Run a draw first.'); process.exit(2); }
  const role = ROLE_ALIAS[String(opt('alternatives'))] || String(opt('alternatives'));
  const dir = L.directions.find((d) => d.id === saved.direction.id);
  const current = saved.sections.find((s) => s.role === role)?.id;
  const pool = sectionPool(dir, role, saved.input);
  if (!pool.length) { console.error('No blueprints for role ' + role + '. Roles: --list roles'); process.exit(2); }
  const line = (s) => `- \`${s.id}\`${s.id === current ? ' (dealt)' : ''} — **${s.name}** (${s.shape}). ${s.blueprint.split(/(?<=\.)\s/).slice(0, 2).join(' ')}\n`;
  console.log(`# ${role}: blueprints that suit "${dir.name}"\n`);
  for (const s of pool) console.log(line(s));
  const software = imageryMode(saved.input) === 'interface';
  const others = L.sections.filter((s) => s.role === role && !pool.includes(s) && (software || !softwareOnly(s)) && (s.needs || []).every((n) => saved.input.have.includes(n) || (n === 'product-ui' && software)));
  if (others.length) {
    console.log(`# Other ${role} blueprints (written for other directions; if one fits the content better, take its geometry and set it in this direction's type, colour and manner)\n`);
    for (const s of others) console.log(line(s));
  }
  console.log(`Choose by what the content really is (how many plans, quotes, items exist), then: node draw.mjs --redraw section:${role}=<id>   and say why in your report.`);
  process.exit(0);
}
if (opt('redraw')) {
  if (!saved) { console.error('Nothing to redraw. Run a draw first.'); process.exit(2); }
  sheet = saved; sheet.redraws = (sheet.redraws || 0) + 1; // the sheet keeps its original seed; slot redraws are counted
  const what = String(opt('redraw'));
  const dir = L.directions.find((d) => d.id === sheet.direction.id);
  if (what === 'direction') sheet = deal({ ...sheet.input, direction: null, avoid: [...(sheet.input.avoid || []), sheet.direction.id] }, sheet.redraws);
  else if (what === 'hero') sheet.hero = dealHero(dir, sheet.input, [sheet.hero?.id]);
  else if (what === 'type') sheet.type = dealType(dir, [sheet.type?.id]);
  else if (what === 'palette') sheet.palette = dealPalette(dir, sheet.input, [sheet.palette?.id]);
  else if (what === 'photos') sheet.photos = dealPhotos(dir, sheet.input);
  else if (what.startsWith('section:')) {
    // section:<role> re-deals at random; section:<role>=<id> takes a named alternative (see --alternatives)
    const [roleRaw, wanted] = what.slice(8).split('=');
    const role = ROLE_ALIAS[roleRaw] || roleRaw;
    const i = sheet.sections.findIndex((s) => s.role === role);
    if (i === -1) { console.error('No section with role ' + role + ' in this sheet.'); process.exit(2); }
    const used = sheet.sections.map((s) => s.id);
    if (wanted) {
      // a blueprint written for another role may be borrowed when its geometry fits the content better
      const chosen = L.sections.find((s) => s.id === wanted);
      if (!chosen) { console.error(`No blueprint with id ${wanted}. List them with --alternatives <role>.`); process.exit(2); }
      sheet.sections[i] = chosen.role === role ? chosen : { ...chosen, role, name: `${chosen.name} (borrowed from ${chosen.role})` };
    } else sheet.sections[i] = dealSection(dir, role, used, sheet.sections[i - 1]?.shape, sheet.sections[i + 1]?.shape, sheet.input) || sheet.sections[i];
  } else { console.error('Unknown slot. Use hero, type, palette, photos, section:<role>, section:<role>=<id> or direction.'); process.exit(2); }
} else {
  const sector = String(opt('sector', ''));
  if (!SECTORS.includes(sector)) {
    console.error(`--sector is required. One of:\n  ${SECTORS.join(', ')}\nPick the closest; use "other" only when nothing fits.`);
    process.exit(2);
  }
  const requested = list(opt('sections'));
  const input = {
    brief: typeof opt('brief') === 'string' ? opt('brief') : '', sector,
    tone: TONES.includes(opt('tone')) ? opt('tone') : null,
    have: list(opt('have')), keep: list(opt('keep')), avoid: list(opt('avoid')),
    sections: (requested.length ? requested : DEFAULT_SECTIONS[sector]).map((r) => ROLE_ALIAS[r] || r).filter((r) => r !== 'hero'),
    direction: typeof opt('direction') === 'string' ? opt('direction') : null,
  };
  if (input.direction && !L.directions.some((d) => d.id === input.direction)) { console.error(`No direction with id ${input.direction}. List them with --list directions.`); process.exit(2); }
  if (opt('options')) {
    const n = Math.max(2, Math.min(5, Number(opt('options')) || 3));
    const options = dealOptions(input, n);
    console.log(`# ${n} directions dealt for this brief\n`);
    console.log('These are optional direction candidates. User requirements, selected references, existing brand, and functional roles take priority.');
    console.log('Skip the draw when those already establish the direction. If a candidate fits, inspect its full sheet with `--direction <id>` (without --options).\n');
    for (const d of options) {
      console.log(`## \`${d.id}\` — ${d.name}`);
      console.log(`Idea engine: ${d.idea.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      console.log(`Composition: ${d.composition.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      if (d.needsPictures) console.log('This candidate is image-led. Check that suitable real assets exist; adapt or skip it if the brief is better served by UI, illustrations, or type.');
      console.log('');
    }
    process.exit(0);
  }
  sheet = deal(input, 0);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(sheetPath, JSON.stringify(sheet, null, 1));
if (!opt('redraw') || String(opt('redraw')) === 'direction') writeHist({ at: sheet.at, direction: sheet.direction.id, type: sheet.type?.id, palette: sheet.palette?.id, hero: sheet.hero?.id, sector: sheet.input.sector });
console.log(render(sheet));

// ---------- dealing ----------
// What kind of pictures this build can honestly have. It decides which blueprints are dealt and how the
// sheet tells the agent to fill picture slots.
function imageryMode(input) {
  if (input.have.includes('product-photo') || input.have.includes('photography')) return 'own';
  if (['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance'].includes(input.sector)) return 'interface';
  if (['physical-product', 'ecommerce'].includes(input.sector)) return 'no-product-photo';
  return 'atmosphere';
}
function pictureLed(x) { return (x.tags || []).includes('photo-led') || (x.tags || []).includes('object-led'); }
function worksWithoutPictures(x) { return !pictureLed(x) || (x.tags || []).some((t) => ['ui-led', 'type-led', 'colour-field'].includes(t)); }

// The directions that suit this brief and the assets it really has.
function directionPool(input) {
  const has = (need) => input.have.includes(need) || need === 'photography'; // the photo library covers photography
  let pool = L.directions.filter((d) => (d.sectors.includes(input.sector) || d.sectors.includes('*')) && !input.avoid.includes(d.id));
  const feasible = pool.filter((d) => (d.needs || []).every(has));
  if (feasible.length) pool = feasible;
  // directions built on photographs of the subject are not dealt when the subject cannot be photographed honestly
  const mode = imageryMode(input);
  if (mode === 'interface' || mode === 'no-product-photo') { const plain = pool.filter((d) => !d.needsPictures); if (plain.length >= 3) pool = plain; }
  if (input.tone) { const toned = pool.filter((d) => (d.tones || []).includes(input.tone)); if (toned.length >= 2) pool = toned; }
  if (!pool.length) pool = L.directions.filter((d) => !input.avoid.includes(d.id));
  return pool;
}
// Three directions dealt at random from the pool, for the builder to choose the one that carries its idea.
function dealOptions(input, n) {
  const pool = directionPool(input); const out = [];
  let rest = fresh(pool, recent('direction', Math.min(5, pool.length - n)));
  while (out.length < n && pool.length > out.length) {
    if (!rest.length) rest = pool.filter((d) => !out.includes(d));
    const d = pick(rest); out.push(d); rest = rest.filter((x) => x !== d);
  }
  return out;
}
function deal(input, redraws) {
  const pool = directionPool(input);
  const forced = input.direction ? L.directions.find((d) => d.id === input.direction) : null;
  const dir = forced || pick(fresh(pool, recent('direction', Math.min(5, pool.length - 1))));
  const s = { version: 1, at: new Date().toISOString(), seed: startSeed, redraws, input, imagery: imageryMode(input), allow: dir.allow || [], direction: dir };
  s.hero = dealHero(dir, input, []);
  s.type = input.keep.includes('type') ? null : dealType(dir, []);
  s.palette = input.keep.includes('palette') ? null : dealPalette(dir, input, []);
  s.photos = dealPhotos(dir, input);
  s.motion = L.motions.find((m) => m.id === (s.hero?.motion || dir.motion)) || L.motions.find((m) => m.id === dir.motion) || null;
  s.sections = [];
  for (const role of input.sections) {
    const sec = dealSection(dir, role, s.sections.map((x) => x.id), s.sections.at(-1)?.shape, null, input);
    if (sec) s.sections.push(sec); else s.sections.push({ id: null, role, shape: null, name: role, blueprint: null });
  }
  s.references = dealReferences(dir, input);
  return s;
}
function dealHero(dir, input, exclude) {
  let pool = L.heroes.filter((h) => (dir.heroes || []).includes(h.id));
  if (!pool.length) pool = L.heroes.filter((h) => (h.directions || []).includes(dir.id));
  if (!pool.length) pool = L.heroes;
  if (imageryMode(input) !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((h) => !softwareOnly(h)); if (plain.length) pool = plain; }
  const ok = pool.filter((h) => !exclude.includes(h.id) && (h.needs || []).every((n) => n === 'photography' || input.have.includes(n)));
  return pick(fresh(ok.length ? ok : pool.filter((h) => !exclude.includes(h.id)).length ? pool.filter((h) => !exclude.includes(h.id)) : pool, recent('hero', 3)));
}
function dealType(dir, exclude) {
  let pool = L.type.filter((t) => (dir.type || []).includes(t.id) || (dir.typeClasses || []).includes(t.class));
  if (!pool.length) pool = L.type;
  const p = pool.filter((t) => !exclude.includes(t.id));
  return pick(fresh(p.length ? p : pool, recent('type', Math.min(6, pool.length - 1))));
}
function dealPalette(dir, input, exclude) {
  let pool = L.palettes.filter((p) => (dir.palettes || []).includes(p.id) || (p.tags || []).some((t) => (dir.paletteTags || []).includes(t)));
  if (!pool.length) pool = L.palettes;
  const p = pool.filter((x) => !exclude.includes(x.id));
  return pick(fresh(p.length ? p : pool, recent('palette', Math.min(6, pool.length - 1))));
}
function dealPhotos(dir, input) {
  if (dir.photos === false) return null; // image-free directions
  const words = briefWords(input.brief);
  const mode = imageryMode(input);
  const SOFT_SETS = ['architecture', 'fog-and-quiet', 'sky-and-space', 'texture', 'water'];
  // subject first (sector + words of the brief), then the direction's preferred tone
  const scored = Object.entries(L.photos.sets).map(([id, set]) => {
    let score = (set.sectors || []).includes(input.sector) ? 3 : 0;
    if ((set.primary || []).includes(input.sector)) score += 5;
    // rooms and tables would be taken for this very house: for places to stay, deal the surroundings instead
    if (mode === 'atmosphere' && ['hospitality', 'real-estate'].includes(input.sector) && id === 'interior-and-table') score -= 6;
    score += words.filter((w) => (set.keywords || []).some((k) => k === w || (k.length >= 5 && w.startsWith(k)) || (w.length >= 5 && k.startsWith(w)))).length * 4;
    score += set.photos.filter((ph) => words.some((w) => ph.alt.toLowerCase().includes(w))).length;
    if (dir.photoTone) score += set.photos.filter((ph) => ph.tone === dir.photoTone).length / set.photos.length;
    return { id, set, score };
  }).filter((x) => x.score > 0 && x.set.photos.length >= 5 && (mode !== 'interface' || SOFT_SETS.includes(x.id))).sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  // one set, so the photographs share a subject and a light; choose among the best-fitting few
  const top = scored.filter((x) => x.score >= scored[0].score * 0.6).slice(0, 4);
  const chosen = pick(top);
  let pool = chosen.set.photos;
  if (dir.photoTone) { const toned = pool.filter((ph) => ph.tone === dir.photoTone || ph.tone === 'mid'); if (toned.length >= 6) pool = toned; }
  // Without product photographs, a picture of the same kind of thing would pass for the product: deal
  // those last and mark them. Otherwise a picture that matches the brief is the better atmosphere.
  const things = words.filter((w) => w.length >= 5);
  const matches = (ph) => things.some((w) => ph.alt.toLowerCase().includes(w));
  const bonus = mode === 'no-product-photo' ? -2 : 2;
  const ranked = shuffle(pool).sort((a, b) => (b.quality + (matches(b) ? bonus : 0)) - (a.quality + (matches(a) ? bonus : 0)))
    .map((ph) => (mode === 'no-product-photo' && matches(ph) ? { ...ph, lookalike: true } : ph));
  return { set: chosen.id, title: chosen.set.title, note: chosen.set.note, treatment: dir.photoTreatment || null, others: scored.filter((x) => x.id !== chosen.id).slice(0, 4).map((x) => x.id), photos: ranked.slice(0, mode === 'interface' ? 4 : 8) };
}
function briefStop() {
  return new Set(['with', 'that', 'this', 'from', 'page', 'site', 'website', 'landing', 'their', 'they', 'have', 'will', 'your', 'about', 'into', 'make', 'build', 'create', 'design', 'small', 'based', 'called', 'named', 'which', 'where', 'what', 'need', 'want', 'like', 'also', 'some', 'very', 'more', 'most', 'just', 'than', 'then', 'them', 'and', 'the', 'for', 'one', 'hand', 'handmade', 'made', 'batch', 'ship', 'ships', 'week', 'within', 'across', 'euro', 'euros', 'cost', 'price', 'open', 'only', 'each', 'every', 'there', 'images', 'photos', 'photograph', 'static', 'html']);
}
function briefWords(brief) {
  const stop = briefStop();
  return [...new Set(String(brief || '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !stop.has(w)).map((w) => w.replace(/(ies|es|s)$/, '')))].filter((w) => w.length >= 4);
}
// First queries for scripts/assets.mjs, built from the brief: the place in old postcards and maps, then the
// subject itself. In testing "<place> postcard" and "<place> old map" found archival material far more
// reliably than a place and a year. A start only: the better queries come from the builder's inventory.
function assetQueries(input) {
  const brief = String(input.brief || '');
  const notPlace = /^(?:january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?$/i;
  const placeRe = /(?:^|[\s,(])(?:in|at|near|from|on|above|below|beside|outside|off|over)\s+(\p{Lu}[\p{L}'’-]*(?:\s+(?:\p{Lu}[\p{L}'’-]*|de|da|do|dos|das|di|del|van|von|der|den))*)/gu;
  const place = [...brief.matchAll(placeRe)].map((m) => m[1].trim()).find((p) => !notPlace.test(p.split(/\s+/)[0]));
  const stop = briefStop();
  const generic = new Set(['seat', 'seats', 'room', 'rooms', 'minute', 'minutes', 'hour', 'hours', 'night', 'nights', 'year', 'years', 'people', 'family', 'local', 'short', 'best', 'making', 'selling', 'serving', 'offering', 'business', 'company', 'brand', 'shop', 'store', 'studio', 'service', 'services', 'dinner', 'lunch', 'breakfast', 'included', 'online', 'modern']);
  // the subject: the last plain words of the first noun phrase ("a 38-seat Italian restaurant in ..." gives "restaurant")
  const words = brief.split(/\s+/).filter(Boolean); const phrase = [];
  for (let k = words.findIndex((w) => /^an?$/i.test(w)) + 1; k < words.length; k++) {
    if (/^(?:in|at|on|for|from|with|near|above|below|by|that|which|who|of|and|to)$/i.test(words[k])) break;
    phrase.push(words[k].replace(/[,.;:()!?]+$/, ''));
    if (/[,.;:()!?]$/.test(words[k])) break;
  }
  const plain = phrase.filter((w) => /^\p{Ll}{3,}$/u.test(w) && !stop.has(w) && !generic.has(w));
  const subject = plain.slice(-2).join(' ') || (input.sector !== 'other' ? input.sector.replace(/-/g, ' ') : null);
  const out = [];
  if (place) out.push(`${place.toLowerCase()} postcard`, `${place.toLowerCase()} old map`);
  if (subject) out.push(subject.toLowerCase());
  return [...new Set(out)];
}
// Blueprints written for showing software (an interface fragment is their picture).
function softwareOnly(x) { return (x.directions || [])[0] === 'product-performs' || (x.tags || []).includes('ui-led') || /data-ui|interface fragment/i.test(x.blueprint || ''); }
// Library blueprints carry their source site's sizes, colours and treatments.
// These review notes help adapt a suggestion without overruling the brief,
// selected references, existing brand, functional roles or readable content.
function adjustments(bp, s) {
  const text = [bp.blueprint, bp.mobile, bp.headline].filter(Boolean).join(' ');
  const notes = [];
  const sizes = (re) => [...new Set([...text.matchAll(re)].map((m) => m[1] + 'px'))];
  const notSpacing = String.raw`(?!\s*(?:gaps?|gutters?|margins?|padding|radius|corners?|apart|from|inset|offset|high|tall|wide|thick|square|borders?|stroke|rules?|line\b|dots?|circles?|bars?|of|between|beneath|below|above|under|down|up|across|deep|left|right|in\b|to\b|and\b|each))`;
  const tiny = sizes(new RegExp(String.raw`(?<!(?:radius|radii|gap|margin|padding|inset|offset)[:\s]{0,3}(?:of\s)?)\b(9|10|11|12)(?:\.\d)?px\b` + notSpacing, 'g'));
  if (tiny.length) notes.push(`It sets text at ${tiny.join(', ')}: use your small step (13px or more) instead.`);
  const running = sizes(/\b(14|15)px\s*(?:paragraphs?|body|text|descriptions?|copy|sentences?|answers?)/gi);
  if (running.length) notes.push(`It sets running text at ${running.join(', ')}: paragraphs use your body step (16px or more).`);
  if (/\d{1,2}% (?:opacity|black|ink|grey|gray|white)|opacity:? ?0?\.\d|\b(?:rest|others?|remaining)\b[^.;]{0,25}\b(?:at|to) \d{1,2}%(?! (?:of|width|wide))|full (?:ink|white|strength)[^.;]{0,60}\bat \d{1,2}%(?! (?:of|width|wide))/i.test(text)) notes.push('It fades text: check the actual rendered contrast, including inactive list items. Ordinary text needs 4.5:1 and large text 3:1; use weight, a marker, or colour to distinguish states when opacity would make them unreadable.');
  if (/\d+px (?:corner )?radius|radius (?:of )?\d+px|\brounded\b|\bpill/i.test(text)) notes.push('It suggests corner treatments: adapt them to the existing brand and component roles. Different media masks or control shapes can be intentional.');
  if (/\b(?:serif|sans-serif|condensed|grotesk|italic|monospace|mono|all caps|uppercase|capitals|script)\b/i.test(text)) notes.push(s.type ? `It suggests type choices: compare the candidate faces (display ${s.type.display.family}, text ${s.type.text.family}) with the selected references, brand, and the scripts the content needs.` : 'It suggests type choices: keep the brand faces and check the real content at each width.');
  const colours = [...new Set([...text.matchAll(/\b(green|red|blue|yellow|orange|pink|purple|teal|navy|cream|beige|brown|grey|gray|white|black)\b(?![- ](?:space|studio|background disappears))/gi)].map((m) => m[1].toLowerCase()))];
  if (colours.length) notes.push(`It names colours (${colours.join(', ')}): compare their roles with the existing brand and selected references. Keep useful semantic status colours and verify contrast; the dealt palette is optional.`);
  if (/(?<!\b(?:no|without|never|not|nor) (?:a |any )?)\b(?:rule|rules|hairline|border|borders|divider|underline|thin line|1px line)\b/i.test(text)) notes.push('It suggests lines or borders: keep them when they clarify calendar cells, tables, cards, navigation or the reference composition. Review their purpose and weight rather than removing them automatically.');
  if (/shadow|glow/i.test(text)) notes.push('It suggests a shadow or glow: compare its purpose with the selected references and brand, and check that it supports legibility or hierarchy.');
  const bigSentence = [...text.matchAll(/\b(?:sentence|statement|paragraph|quotation|quote)\b[^.;]{0,40}?\b(?:at|to)\s+(?:clamp\(\s*\d+(?:\.\d+)?px,\s*)?(\d+(?:\.\d+)?)(px|vw)/gi)].some((m) => (m[2] === 'px' && +m[1] > 36) || (m[2] === 'vw' && +m[1] > 2.6));
  if (bigSentence) notes.push('It sets a long sentence large: preserve meaningful copy, including complete performance names. Adapt size, measure and line breaks to the reference hierarchy and mobile reading; two lines is not a content limit.');
  if (/(?:sticky|pinned|pins?\b|stays? (?:fixed|put|in place))/i.test(text) && /\b(?:three|four|five|six) (?:to (?:four|five|six) )?(?:viewports|screens)\b|\b[3-6]00svh\b/i.test(text)) notes.push('It suggests a long pinned sequence: verify reading order, keyboard access and every scroll state, especially on mobile. Keep meaningful text visible and unobscured.');
  if (/mix-blend-mode:\s*(?:difference|exclusion)/i.test(text)) notes.push('It suggests blended text: verify contrast on every actual background and provide a readable fallback when needed.');
  if (/tops? of the (?:letters|word|name|wordmark)|(?:letters|wordmark|name|word)\b[^.;]{0,30}\b(?:sliced|cut|cropped|clipped)[^.;]{0,20}\btop/i.test(text)) notes.push('It crops letters along their top: preserve readable meaningful text, including titles and navigation. Fix accidental text clipping at each viewport.');
  if (bp.archetype && /single action[^.;]{0,40}?\b(?:text link|underlined (?:text )?link)/i.test(text)) notes.push('Its action is a text link: choose link or button semantics for the real action, make it easy to find, and provide visible focus and a usable touch target.');
  if (s.type?.class === 'condensed-heavy' && /\d+(?:\.\d+)?vw/.test(text)) notes.push('Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.');
  if (/\b0[1-9]\b(?![:.,]\d)|numbered|index number/i.test(text)) notes.push('It suggests index numbers: retain useful dates, counts and ordered navigation. Decorative numbering is a reference/functional-fit decision.');
  return notes;
}
// Every blueprint of a role that suits this direction and this build's real assets.
function sectionPool(dir, role, input) {
  let pool = L.sections.filter((s) => s.role === role);
  if (!pool.length) return [];
  const mode = imageryMode(input);
  const feasible = pool.filter((s) => (s.needs || []).every((n) => n === 'photography' || input.have.includes(n) || (n === 'product-ui' && mode === 'interface')));
  if (feasible.length) pool = feasible;
  if (mode !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((s) => !softwareOnly(s)); if (plain.length) pool = plain; }
  if (mode === 'interface' || mode === 'no-product-photo') {
    // prefer compositions that do not hang on a photograph of the thing
    const honest = pool.filter((s) => (mode === 'interface' ? worksWithoutPictures(s) : !(s.tags || []).includes('object-led') || worksWithoutPictures(s)));
    if (honest.length >= 2) pool = honest;
  }
  const byDirection = pool.filter((s) => (s.directions || []).includes(dir.id));
  if (byDirection.length) return byDirection;
  const byTag = pool.filter((s) => (s.tags || []).some((t) => (dir.sectionTags || []).includes(t)));
  return byTag.length ? byTag : pool;
}
function dealSection(dir, role, usedIds, prevShape, nextShape, input) {
  let pool = sectionPool(dir, role, input);
  if (!pool.length) return null;
  if (imageryMode(input) === 'interface') { const ui = pool.filter((s) => (s.tags || []).includes('ui-led')); if (ui.length >= 2 && rnd() < 0.6) pool = ui; }
  const unused = pool.filter((s) => !usedIds.includes(s.id)); if (unused.length) pool = unused;
  const varied = pool.filter((s) => s.shape !== prevShape && s.shape !== nextShape); if (varied.length) pool = varied;
  return pick(pool);
}
function dealReferences(dir, input) {
  const named = (dir.seenIn || []).map((n) => L.sites.find((s) => s.id === n || s.name === n)).filter(Boolean);
  const sameKind = L.sites.filter((s) => s.kind === input.sector && s.score >= 7.2 && !named.includes(s));
  const out = [...shuffle(named).slice(0, 2), ...shuffle(sameKind).slice(0, 1)];
  return out.length ? out : shuffle(L.sites.filter((s) => s.score >= 7.6)).slice(0, 2);
}

// ---------- rendering ----------
function siteCard(s, full) {
  const lines = [`- **${s.name}** (${s.source}, model study score ${s.score}) \`${s.id}\``, `  URL: ${s.url}`, `  Idea: ${s.idea}`, `  Hero: ${s.hero}`];
  if (full) {
    lines.push(`  Type: ${s.type}`, `  Colour: ${s.colour}`, `  Imagery: ${s.imagery}`, `  Layout: ${s.layout}`);
    for (const sec of s.sections || []) lines.push(`  Section (${sec.role}): ${sec.description}`);
    for (const t of s.steal || []) lines.push(`  Worth taking: ${t}`);
  } else if (s.steal?.[0]) lines.push(`  Worth taking: ${s.steal[0]}`);
  return lines.join('\n');
}
function render(s) {
  const d = s.direction; const o = [];
  const p = (x = '') => o.push(x);
  p(`# DIRECTION SHEET — ${d.name}`);
  p(`seed ${s.seed} · drawn ${s.at.slice(0, 10)}${s.redraws ? ` · redraws: ${s.redraws}` : ''} · sector ${s.input.sector}${s.input.tone ? ' · tone ' + s.input.tone : ''}`);
  if (s.input.brief) p(`Brief: ${s.input.brief}`);
  p();
  p('| | |'); p('| --- | --- |');
  p(`| Direction | ${d.name} |`);
  p(`| Hero | ${s.hero.name} |`);
  p(`| Type | ${s.type ? s.type.name : 'kept from the brand'} |`);
  p(`| Colour | ${s.palette ? s.palette.name : 'kept from the brand'} |`);
  p(`| Sections | ${s.sections.map((x) => x.role + (x.name && x.name !== x.role ? ' (' + x.name + ')' : '')).join(' → ')} |`);
  p(`| Motion | ${s.motion ? s.motion.name : '—'} |`);
  p(`| Photographs | ${s.photos ? 'the "' + (s.photos.title || s.photos.set) + '" set, as atmosphere' : 'none'} |`);
  p();
  p('This is an optional direction suggestion. User requirements, selected references, existing brand, and functional roles take priority.');
  p('Skip this draw when the project already has a direction. Adapt, combine, replace or omit any suggestion that does not serve the brief,');
  p('and record the reference evidence and reason for the decisions you keep. The library text below describes candidates, not requirements.');
  p();
  p('Resolve conflicts by preserving the requested content, tasks, brand and reference evidence, then verifying readability and actual behaviour.');
  p('Compare candidate geometry, typography and colour proportions with those needs. Existing tokens and working components may be retained.');
  p('Repeated cards, icons, calendar lines and status labels are useful when they help exploration. Do not change the information architecture to fit a blueprint.');
  p('Review notes below identify adaptation points; they do not impose a house style.');
  p();
  p('## 1. The idea'); p(d.idea); p();
  p('If a concept helps this project, explain how it follows from the real subject and selected references. Do not invent client facts to make it unique.');
  p('Identify the visitor tasks already required by the brief; a calendar, booking flow or filter may provide the useful interaction.'); p();
  p('## 2. Composition'); p(d.composition); p();
  if (s.type) {
    const t = s.type;
    p(`## 3. Type — ${t.name}`); p(t.note);
    p('```html'); for (const l of [...new Set([t.display.css, t.text.css].filter(Boolean))]) p(l); p('```');
    p(`- Display: **${t.display.family}** — ${t.display.settings}`);
    p(`- Text: **${t.text.family}** — ${t.text.settings}`);
    if (t.scale) { p('```css'); p(':root {'); for (const [k, v] of Object.entries(t.scale)) p(`  --${k}: ${v};`); p('}'); p('```'); }
    if (d.typography) p(d.typography);
    p('These faces, settings and size steps are candidates. Use the existing brand or selected reference system when established, and check actual content and font coverage at each width.');
    p();
  } else { p('## 3. Type'); p('Kept from the brand. Preserve its faces and roles; adjust only what the real content and readability require.'); p(); }
  if (s.palette) {
    const c = s.palette;
    p(`## 4. Colour — ${c.name}`); p('```css'); p(':root {');
    for (const k of ['bg', 'surface', 'ink', 'muted', 'accent', 'accentInk']) if (c[k]) p(`  --${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${c[k]};`);
    (c.fields || []).forEach((f, i) => p(`  --field-${i + 1}: ${f.bg};${f.ink ? `  --field-${i + 1}-ink: ${f.ink};` : ''}`));
    p('}'); p('```'); p(c.note); if (d.colour) p(d.colour); p();
  } else { p('## 4. Colour'); p('Kept from the brand. Preserve its palette and useful status colours, and verify rendered contrast.'); p(); }
  p('## 5. Imagery');
  // where to look for real pictures of the subject's world, with first queries built from the brief
  const qs = assetQueries(s.input);
  const find = qs.length
    ? `\`${ASSETS_CMD} "${qs[0]}"\`${qs.length > 1 ? `, then ${qs.slice(1).map((q) => `"${q}"`).join(' and ')}` : ''}, then queries from your inventory (its street, its materials, its trade's tools and history)`
    : `\`${ASSETS_CMD} "<a place, material or object from your inventory>"\``;
  const MODE = {
    interface: '**No product screenshots were declared.** A real interface, clearly identified sample prototype, illustration, or type-led layout may fit. Do not invent product data or present a sample as a working service. `data-ui` is only for a cropped interface fragment, never a page-level exemption.',
    'no-product-photo': '**No product photographs were declared.** Use honest illustrations, type, or appropriate subject imagery where useful. Do not pass a substitute off as the actual product. If relevant open-collection material is needed, start with ' + find + '; verify its licence and credit what you use.',
    atmosphere: '**No project photographs were declared.** Confirm what assets actually exist. Type, UI, illustration, or subject-relevant atmosphere may fit; omit picture slots that do not help the brief. For relevant open-collection material, optional starting queries are ' + find + '. Verify licences and credit used assets, and distinguish atmosphere from the client\'s own performances, products, people or place.',
    own: '**Project imagery was declared.** Choose it where it supports the content and selected references. Re-crop for mobile and preserve useful poster proportions. Omit unnecessary slots instead of filling them with unrelated material.',
  };
  p(MODE[s.imagery || 'atmosphere']); p(); p(d.imagery);
  p(); p('**Imagery review:** the source direction\'s quantities and treatments are optional suggestions, not quotas. No picture count or video is required. Choose media for the real content, available assets, brand and references; do not add unrelated imagery to satisfy a gate.');
  if (s.photos) {
    p();
    p(`Optional atmosphere candidates from the "${s.photos.title || s.photos.set}" set (${s.photos.note}). Use only candidates relevant to the content.`);
    p('The project\'s own assets, honest illustrations, optional generated imagery, or licensed subject material may serve the brief better.');
    p('These bundled photographs are served by picsum.photos. Verify the source and licence of anything you use, identify it as atmosphere,');
    p('and record replacements where required. They do not depict the client\'s actual performance, product, person or interface.');
    if (s.photos.treatment) p(`Treatment: ${s.photos.treatment}`);
    for (const ph of s.photos.photos) p(`- \`https://picsum.photos/id/${ph.id}/1600/1000\` — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.lookalike ? ' · **could be taken for the product: never use it as the product**' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · native ${ph.ratio >= 1.15 ? 'landscape' : ph.ratio <= 0.87 ? 'portrait' : 'square'} · photo: ${ph.by}`);
    p('The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and');
    p('add `?grayscale` if that treatment fits. For used images, set `width`, `height`, meaningful `alt`, and suitable loading priority.');
    if (s.photos.others?.length) p(`Other candidate sets: ${s.photos.others.join(', ')} — \`node draw.mjs --photos <set>\` prints one in full; \`--photos list\` shows all sets. Check actual relevance before choosing.`);
  } else if (d.photos === false) {
    p(); p('This candidate does not lead with photographs. Keep that approach when it fits the content and selected references.');
  }
  p();
  const adjust = (bp) => { const n = adjustments(bp, s); if (n.length) { p(); p('Review for this page:'); for (const x of n) p(`- ${x}`); } };
  p(`## 6. Hero — ${s.hero.name}`); p(s.hero.blueprint); p(); p(`On a phone: ${s.hero.mobile}`); if (s.hero.headline) p(`Headline: ${s.hero.headline}`); adjust(s.hero); p();
  p('## 7. Sections, in order');
  p('These are composition candidates for the requested roles. Keep complete content and useful repeated modules; adapt geometry,');
  p('order and density to the user\'s tasks and selected references. Do not replace a calendar or card archive with an unrelated blueprint.');
  s.sections.forEach((sec, i) => {
    p();
    if (!sec.blueprint) { p(`### ${i + 1}. ${sec.role}`); p('No blueprint in the library for this role. Design this requested functional role directly from the brief and selected references; preserve the role rather than forcing it into a library category.'); return; }
    p(`### ${i + 1}. ${sec.role} — ${sec.name} (${sec.shape})`); p(sec.blueprint); if (sec.mobile) p(`On a phone: ${sec.mobile}`); adjust(sec);
  });
  p();
  if (s.motion) { p(`## 8. Optional motion — ${s.motion.name}`); p(s.motion.description); p('Use this candidate only when it supports the reference direction or meaningful feedback. A still page is valid. Keep content and controls available with reduced motion, and check the actual states. Recipes: references/motion.md.'); p(); }
  if (d.richness) { p('## 9. Where the richness comes from'); p(d.richness); p(); }
  if (d.pitfalls) { p('## 10. How this direction goes wrong'); p(d.pitfalls); p(); }
  if (s.references?.length) {
    p('## 11. Real references');
    p('Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.');
    for (const r of s.references) p(siteCard(r, false));
    p('Full notes on any of them: `node draw.mjs --site <id>`. These are model study observations, not live verification.');
    p('For the role-based reference catalog and direct case links, use `node <skill>/scripts/references.mjs --list` or `--role <role>`.'); p();
  }
  p('## Verify the chosen design');
  p('Run `lint.mjs` and `inspect.mjs` with the default reference profile. Review style observations against evidence, brand and functional fit.');
  p('Fix actual overflow, broken assets, obscured or clipped readable text, insufficient contrast and unusable controls. Preserve meaningful content at mobile widths.');
  p('The legacy strict taste experiment is available only when explicitly requested with `--profile house`; it does not override the brief.');
  if (s.allow?.length) p(`Saved style allowances: ${s.allow.join(', ')}. They cannot suppress correctness failures.`);
  p();
  p(`Saved to ${sheetPath.split('\\').join('/')} · reprint with \`node draw.mjs --show\``);
  return o.join('\n');
}
