import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { defineServiceForm } from "../src/page-completion/requests.ts";
import type { ServiceFormDefinition } from "../src/page-completion/requests.ts";
import { COMPLETION_PAGES } from "../src/page-completion/content.ts";

// [독립 PostgreSQL 검증 환경 / Isolated PostgreSQL verification environment]
const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const base = path.join(root, ".lemonade/postgres");
const bin = path.join(base, "portable/pgsql/bin");
const data = path.join(base, "data");
const port = "55439";
const database = `sejong_service_check_${Date.now()}_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
const migrationPath = path.join(base, `${database}.sql`);
const command = (name: string, args: string[]) => exec(path.join(bin, `${name}.exe`), args, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
const args = ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-p", port, "-U", "postgres"];
const sql = async (query: string, db = database) => (await command("psql", [...args, "-d", db, "-c", query])).stdout.trim();
let started = false;
let created = false;
await mkdir(base, { recursive: true });
try { await access(path.join(data, "PG_VERSION")); }
catch { await command("initdb", ["-D", data, "-U", "postgres", "--auth=trust", "--encoding=UTF8", "--locale=C"]); }
try { await command("pg_ctl", ["-D", data, "status"]); }
catch {
    await new Promise<void>((resolve, reject) => {
        const child = spawn(path.join(bin, "pg_ctl.exe"), ["-D", data, "-l", path.join(base, "server.log"), "-o", `-h 127.0.0.1 -p ${port} -c max_connections=220`, "-w", "start"], { windowsHide: true, stdio: "ignore" });
        child.on("error", reject);
        child.on("exit", code => code === 0 ? resolve() : reject(new Error(`pg_ctl start exited ${code}`)));
    });
    started = true;
}
try {
    await sql(`create database ${database}`, "postgres");
    created = true;
    await sql("do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$; create schema auth; create schema sejong_private; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;");
    const migration = await readFile(path.join(root, "supabase/migrations/20261023061733_service_requests.sql"), "utf8");
    // [Windows 제외 항목은 예약 등록뿐 / Only Windows-unavailable pg_cron setup is excluded]
    const localMigration = migration.replace(/^create extension if not exists pg_cron with schema pg_catalog;\r?\n/m, "").replace(/^select cron\.schedule\([^\n]*\);\r?$/m, "");
    assert.ok(localMigration.includes("create function sejong_private.purge_service_data()"));
    assert.ok(!localMigration.includes("cron.schedule("));
    await writeFile(migrationPath, localMigration, "utf8");
    await command("psql", [...args, "-d", database, "-f", migrationPath]);
    await command("psql", [...args, "-d", database, "-f", path.join(root, "supabase/tests/service-request-ownership.sql")]);
    console.log("Service-request SQL checks passed: grants/RLS, ownership, validation, retries, server prices, cart clearing, expiry, and retention (rollback-only fixtures).");

    // [실제 페이지 정의와 서버 검증의 일치 / Check server validation against every actual page definition]
    const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
    const forms = COMPLETION_PAGES.map(defineServiceForm).filter((form): form is ServiceFormDefinition => form !== null);
    assert.ok(forms.length > 0);
    assert.ok(forms.some(form => form.kind === "rental"), "Combined definitions must include rental forms");
    assert.ok(forms.some(form => form.id === "/news/goods/cart" && form.kind === "order"), "Combined definitions must include the cart order form");
    const definitions: string[] = ["begin;"];
    for (const form of forms) {
        const owner = crypto.randomUUID();
        const values: Record<string, string | boolean> = { consent: true };
        for (const field of form.fields) {
            if (!field.required) continue;
            values[field.name] = field.type === "email" ? "sql@example.test" : field.type === "tel" ? "010-1234-5678" : field.type === "date" ? "2028-02-29" : field.type === "number" ? String(field.min ?? 1) : field.type === "select" ? field.options![0].value : "SQL verification";
        }
        definitions.push(`insert into public.sejong_service_forms(id,kind,title,definition,enabled) values(${literal(form.id)},${literal(form.kind)},${literal(form.title)},${literal(JSON.stringify(form))}::jsonb,${form.enabled});`);
        definitions.push(`insert into auth.users(id) values('${owner}'); select set_config('request.jwt.claim.sub','${owner}',true); set local role authenticated;`);
        if (form.kind === "order" && form.enabled) {
            definitions.push("reset role; insert into public.sejong_service_goods(id,title,description,source_url,price) values('__definition/good','Definition test','Fixture','https://www.sejongpac.or.kr/',100) on conflict do nothing; set local role authenticated; select public.set_sejong_cart_quantity('__definition/good',1);");
        }
        const query = `select public.submit_sejong_request(${literal(form.id)},gen_random_uuid(),${literal(JSON.stringify(values))}::jsonb)`;
        definitions.push(form.enabled ? `${query};` : `do $$ begin begin ${query.replace(/^select /, "perform ")}; raise exception 'Closed definition accepted'; exception when sqlstate '22023' then null; end; end $$;`);
        definitions.push("reset role;");
    }
    definitions.push("rollback;");
    await writeFile(migrationPath, definitions.join("\n"), "utf8");
    await command("psql", [...args, "-d", database, "-f", migrationPath]);
    console.log(JSON.stringify({ actualFormDefinitionsChecked: forms.length, enabled: forms.filter(form => form.enabled).length, closed: forms.filter(form => !form.enabled).length }));

    // [별도 연결의 경쟁 검증 / Independent connections verify retry and cancellation races]
    const owner = "33333333-3333-4333-8333-333333333333";
    const other = "44444444-4444-4444-8444-444444444444";
    await sql(`insert into auth.users(id) values('${owner}'),('${other}'); insert into public.sejong_service_forms(id,kind,title,definition) values('/__race/request','inquiry','Race test','{"fields":[]}'),('/__race/order','order','Order race test','{"fields":[]}'); insert into public.sejong_service_goods(id,title,description,source_url,price) values('__race/good','Race fixture','Fixture','https://www.sejongpac.or.kr/',1000);`);
    const call = async (query: string, user = owner): Promise<Record<string, unknown>> => {
        const output = await sql(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${user}',true); select ${query}; commit;`);
        return JSON.parse(output.split(/\r?\n/).find(line => line.startsWith("{"))!);
    };
    const retryKey = crypto.randomUUID();
    const submissions = await Promise.all(Array.from({ length: 24 }, () => call(`public.submit_sejong_request('/__race/request','${retryKey}','{"consent":true}')`)));
    assert.equal(new Set(submissions.map(result => result.id)).size, 1);
    assert.equal(new Set(submissions.map(result => result.expires_at)).size, 1);
    assert.equal(await sql(`select count(*) from public.sejong_service_requests where request_key='${retryKey}'`), "1");
    await Promise.all(Array.from({ length: 16 }, () => sql(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${owner}',true); select public.set_sejong_cart_quantity('__race/good',1,true); commit;`)));
    assert.equal(await sql(`select quantity from public.sejong_service_cart where user_id='${owner}' and good_id='__race/good'`), "16", "Concurrent increments must not lose updates");
    await sql(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${owner}',true); select public.set_sejong_cart_quantity('__race/good',3); commit;`);
    const orderKey = crypto.randomUUID();
    const orders = await Promise.all(Array.from({ length: 24 }, () => call(`public.submit_sejong_request('/__race/order','${orderKey}','{"consent":true}')`)));
    assert.equal(new Set(orders.map(result => result.id)).size, 1);
    assert.ok(orders.every(result => (result.values as { total: number }).total === 3000));
    assert.equal(await sql(`select count(*) from public.sejong_service_cart where user_id='${owner}'`), "0");
    const requestId = String(submissions[0].id);
    const races = await Promise.all(Array.from({ length: 24 }, (_, index) => call(index % 2 ? `public.cancel_sejong_request('${requestId}')` : `public.submit_sejong_request('/__race/request','${retryKey}','{"consent":true}')`)));
    assert.ok(races.every(result => result.id === requestId));
    const final = await call(`public.submit_sejong_request('/__race/request','${retryKey}','{"consent":true}')`);
    assert.equal(final.status, "cancelled");
    assert.equal(final.expires_at, submissions[0].expires_at);
    const otherRequest = await call(`public.submit_sejong_request('/__race/request','${retryKey}','{"consent":true}')`, other);
    assert.notEqual(otherRequest.id, requestId);
    console.log(JSON.stringify({ independentRetryConnections: 24, retryRows: 1, independentCartIncrementConnections: 16, accumulatedQuantity: 16, independentOrderConnections: 24, orderRows: 1, independentCancelRetryConnections: 24, finalStatus: final.status, stableExpiry: true, ownerScopedKey: true }));
} finally {
    // [생성한 고유 DB만 정리 / Cleanup is limited to this uniquely created scratch database]
    if (created) await sql(`drop database ${database} with (force)`, "postgres");
    await rm(migrationPath, { force: true });
    if (started) await command("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
}
