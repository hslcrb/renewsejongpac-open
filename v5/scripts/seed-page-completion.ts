import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { COMPLETION_PAGES, assertCompletionCoverage } from "../src/page-completion/content.ts";
import { VERIFIED_GOODS } from "../src/page-completion/content/news.ts";
import { defineServiceForm } from "../src/page-completion/requests.ts";

// [허용 경로만 SQL로 반영 / Import only allowlisted paths through SQL]
assertCompletionCoverage();
const literal = (value: unknown) => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
const text = (value: string) => `'${value.replace(/'/g, "''")}'`;
const forms = COMPLETION_PAGES.map(defineServiceForm).filter(form => form !== null);
const sql = ["begin;", `do $$ begin if (select count(*) from public.sejong_pages where id in (${COMPLETION_PAGES.map(page => text(page.path)).join(",")}))<>${COMPLETION_PAGES.length} then raise exception 'Completion source rows are missing'; end if; end $$;`,
    ...COMPLETION_PAGES.map(page => `update public.sejong_pages set payload=jsonb_set(payload,'{completion}',${literal(page)},true) where id=${text(page.path)} and payload->'completion' is distinct from ${literal(page)};`),
    ...forms.map(form => `insert into public.sejong_service_forms(id,kind,title,definition,enabled) values(${text(form.id)},${text(form.kind)},${text(form.title)},${literal(form)},${form.enabled}) on conflict(id) do update set kind=excluded.kind,title=excluded.title,definition=excluded.definition,enabled=excluded.enabled,revision=sejong_service_forms.revision+case when sejong_service_forms.definition is distinct from excluded.definition then 1 else 0 end;`),
    ...VERIFIED_GOODS.map((good, index) => `insert into public.sejong_service_goods(id,title,description,source_url,image,price,sort_order) values(${text(good.id)},${text(good.title)},${text(good.description)},${text(good.sourceUrl)},${good.image ? text(good.image) : "null"},${good.price ?? "null"},${index}) on conflict(id) do update set title=excluded.title,description=excluded.description,source_url=excluded.source_url,image=excluded.image,price=excluded.price,sort_order=excluded.sort_order;`),
    "commit;", "",
].join("\n");
const target = fileURLToPath(new URL("../supabase/page-completion-seed.sql", import.meta.url));
await writeFile(target, sql, "utf8");
const reportDirectory = fileURLToPath(new URL("../.lemonade/site-completion/", import.meta.url));
await mkdir(reportDirectory, { recursive: true });
await writeFile(`${reportDirectory}/coverage.json`, JSON.stringify({ pages: COMPLETION_PAGES.length, forms: forms.length, enabledForms: forms.filter(form => form.enabled).length, goods: VERIFIED_GOODS.length, routes: COMPLETION_PAGES.map(page => ({ path: page.path, title: page.title, sections: page.sections.length, sources: page.sources.length, form: page.form?.kind, special: page.special })) }, null, 2));
console.log(`Completion SQL: ${COMPLETION_PAGES.length} pages, ${forms.length} forms, ${VERIFIED_GOODS.length} goods.`);
