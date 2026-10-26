#!/usr/bin/env node
// Read stored reference and local-build evidence; never fetch or reconnect a repository.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalogUrl = new URL('../library/reference-cases.json', import.meta.url);
const data = JSON.parse(readFileSync(catalogUrl, 'utf8'));
const artifactPathNote = `Local artifact paths are relative to the catalog directory: ${fileURLToPath(new URL('.', catalogUrl))}`;
const availabilityNote = 'Availability checks only build and verification paths; other artifact availability is unchecked.';
const availabilityLabel = available => available
  ? 'Build and verification paths present; other artifact availability unchecked'
  : 'unbundled or unavailable; historical results retained';
const builds = (data.builds ?? []).map(build => ({
  ...build,
  source: {
    ...build.source,
    available: [build.source.path, build.source.verificationPath]
      .every(path => typeof path === 'string' && existsSync(new URL(path, catalogUrl)))
  }
}));
const args = process.argv.slice(2);
let role, id, json = false, list = false, help = false;
const fail = message => { console.error(message); process.exit(2); };
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (flag === '--json') json = true;
  else if (flag === '--list') list = true;
  else if (flag === '--help' || flag === '-h') help = true;
  else if (flag === '--role' || flag === '--id') {
    const value = args[++i];
    if (!value || value.startsWith('--')) fail(`Missing value for ${flag}`);
    if (flag === '--role') role = value; else id = value;
  } else fail(`Unknown option: ${flag}`);
}
if (role && !data.roles.includes(role)) fail(`Unknown role: ${role}. Use --list.`);
if (role && id) fail('Choose --role or --id, not both.');
if (help || (!args.length)) {
  console.log('lemonade references - stored compositions and recorded local build results\nUsage: node references.mjs --list | --role <role> | --id <id> [--json]\nNo network access or verification rerun. Static captures do not establish live behavior.\n' + artifactPathNote + '\n' + availabilityNote);
  process.exit(0);
}
if (list) {
  console.log('Roles: ' + data.roles.join(', '));
  console.log('Stored GDWEB capture evidence:');
  console.log(data.cases.map(c => `${c.id}\t${c.name}\t${c.roles.join(', ')}\t${c.source.evidence}`).join('\n'));
  console.log('Recorded local build results:');
  console.log(availabilityNote);
  console.log(builds.map(b => `${b.id}\t${b.name}\t${b.roles.join(', ')}\t${b.source.evidence}\t${availabilityLabel(b.source.available)}`).join('\n'));
  process.exit(0);
}
const result = {
  ...data,
  boardRegions: data.boardRegions.filter(r => (!role || r.role === role) && (!id || r.id === id)),
  cases: data.cases.filter(r => (!role || r.roles.includes(role)) && (!id || r.id === id)),
  builds: builds.filter(r => (!role || r.roles.includes(role)) && (!id || r.id === id))
};
if (id && !result.boardRegions.length && !result.cases.length && !result.builds.length) fail(`Unknown reference id: ${id}`);
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`lemonade | stored catalog reviewed ${data.reviewedAt}\nStored GDWEB capture evidence: static captures do not establish live behavior.\nRecorded local build results: historical render and interaction reviews; no verification rerun.\n${artifactPathNote}\n${availabilityNote}`);
  for (const r of result.boardRegions) console.log(`\n${r.id} · ${r.title}\nOriginal pixel bounds: ${r.bounds.join(', ')}\n${r.observations.join('\n')}`);
  for (const c of result.cases) {
    console.log(`\n${c.id} · ${c.name}\n${c.source.url}\nOriginal site: ${c.source.originalUrl}\nLive access: ${c.source.liveAccess}\n${c.observations.map(s => 'Observed: ' + s).join('\n')}\n${c.avoid.map(s => 'Limit: ' + s).join('\n')}`);
  }
  for (const b of result.builds) {
    const source = b.source;
    console.log(`\n${b.id} · ${b.name}\nEvidence: ${source.evidence}, recorded ${source.checkedAt}\nLocal build: ${source.path}\nAvailability: ${availabilityLabel(source.available)}\nVerification: ${source.verificationPath}\nPreviews: ${(source.previews ?? []).join(', ')}`);
    if (source.inspection) {
      const review = source.inspection;
      console.log(`Recorded inspection (${review.profile}; widths ${review.widths.join(', ')}): ${review.fail} fail, ${review.warn} warn`);
    }
    if (source.browserQA) {
      console.log(`Recorded browser QA: ${source.browserQA.checks} checks, ${source.browserQA.status}`);
      if (source.browserQA.inputMethodNote) console.log(`Input method: ${source.browserQA.inputMethodNote}`);
    }
    for (const limit of source.limits ?? []) console.log('Evidence limit: ' + limit);
    for (const observation of b.observations) console.log('Observed: ' + observation);
    for (const limit of b.avoid) console.log('Limit: ' + limit);
  }
}
