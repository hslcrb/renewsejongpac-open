-- [신청·문의와 상품 요청의 소유권 / Ownership of service and purchase requests]
create table public.sejong_service_forms (
    id text primary key check (left(id,1)='/'),
    kind text not null check (kind in ('rental','group','inquiry','partnership','donation','recruitment','event','newsletter','membership','education','order')),
    title text not null,
    definition jsonb not null check (jsonb_typeof(definition)='object' and jsonb_typeof(definition->'fields')='array'),
    enabled boolean not null default true,
    revision integer not null default 1
);
create table public.sejong_service_goods (
    id text primary key, title text not null, description text not null,
    source_url text not null check (source_url like 'https://www.sejongpac.or.kr/%'),
    image text, price integer check(price>=0), published boolean not null default true,
    sort_order integer not null default 0, verified_at timestamptz not null default now()
);
create table public.sejong_service_cart (
    user_id uuid not null references auth.users(id) on delete cascade,
    good_id text not null references public.sejong_service_goods(id) on delete cascade,
    quantity integer not null check(quantity between 1 and 20),
    updated_at timestamptz not null default now(), primary key(user_id,good_id)
);
create table public.sejong_service_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    form_id text not null references public.sejong_service_forms(id),
    kind text not null,
    reference text not null unique default ('SJ-'||to_char(now() at time zone 'Asia/Seoul','YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
    request_key uuid not null, input_hash text not null,
    status text not null default 'submitted' check(status in ('submitted','cancelled')),
    values jsonb not null, form_revision integer not null,
    consent_version text not null default '2026-10-23',
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now()+interval '90 days'),
    cancelled_at timestamptz,
    unique(user_id,request_key)
);
create index sejong_service_requests_owner_recent on public.sejong_service_requests(user_id,created_at desc);
create index sejong_service_requests_expiry on public.sejong_service_requests(expires_at);
create index sejong_service_cart_expiry on public.sejong_service_cart(updated_at);

alter table public.sejong_service_forms enable row level security;
alter table public.sejong_service_goods enable row level security;
alter table public.sejong_service_cart enable row level security;
alter table public.sejong_service_requests enable row level security;
revoke all on public.sejong_service_forms,public.sejong_service_goods,public.sejong_service_cart,public.sejong_service_requests from public,anon,authenticated;
grant select on public.sejong_service_forms,public.sejong_service_goods to anon,authenticated;
grant select on public.sejong_service_cart to authenticated;
grant select(id,reference,form_id,kind,status,values,created_at,expires_at) on public.sejong_service_requests to authenticated;
create policy service_forms_public on public.sejong_service_forms for select to anon,authenticated using(true);
create policy service_goods_public on public.sejong_service_goods for select to anon,authenticated using(published);
create policy service_cart_owner on public.sejong_service_cart for select to authenticated using((select auth.uid())=user_id and updated_at>now()-interval '90 days');
create policy service_requests_owner on public.sejong_service_requests for select to authenticated using((select auth.uid())=user_id and expires_at>now());

-- [서버 정의로 재검증하며 제출 / Revalidate against server-owned form definitions]
create function public.submit_sejong_request(p_form_id text,p_request_key uuid,p_values jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
    owner uuid:=auth.uid(); f public.sejong_service_forms; r public.sejong_service_requests;
    field jsonb; value text; unknown_key text; fingerprint text; final_values jsonb;
    items jsonb; total bigint; cart_count integer;
begin
    if owner is null then raise exception '로그인이 필요합니다.' using errcode='28000'; end if;
    if p_form_id is null or p_request_key is null or p_values is null or jsonb_typeof(p_values)<>'object' or octet_length(p_values::text)>20000 then
        raise exception '신청 데이터 형식을 확인해 주세요.' using errcode='22023';
    end if;
    fingerprint:=encode(sha256(convert_to(p_values::text,'UTF8')),'hex');
    perform pg_advisory_xact_lock(hashtextextended(owner::text,90431));
    select * into r from public.sejong_service_requests where user_id=owner and request_key=p_request_key for update;
    if found then
        if r.expires_at<=now() then raise exception '신청 내역을 확인할 수 없습니다.' using errcode='42501'; end if;
        if r.form_id<>p_form_id or r.input_hash<>fingerprint then raise exception '같은 요청키의 입력 내용을 변경할 수 없습니다.' using errcode='22023'; end if;
        return jsonb_build_object('id',r.id,'reference',r.reference,'form_id',r.form_id,'kind',r.kind,'status',r.status,'values',r.values,'created_at',r.created_at,'expires_at',r.expires_at);
    end if;
    select * into f from public.sejong_service_forms where id=p_form_id;
    if not found or not f.enabled then raise exception '현재 접수할 수 없는 신청입니다.' using errcode='22023'; end if;
    if p_values->'consent' is distinct from 'true'::jsonb then raise exception '신청정보 수집·이용 동의가 필요합니다.' using errcode='22023'; end if;
    select k into unknown_key from jsonb_object_keys(p_values) k
      where k<>'consent' and not exists(select 1 from jsonb_array_elements(f.definition->'fields') as allowed_field(definition) where allowed_field.definition->>'name'=k) limit 1;
    if found then raise exception '허용되지 않은 신청 항목입니다.' using errcode='22023'; end if;
    for field in select jsonb_array_elements(f.definition->'fields') loop
        if p_values ? (field->>'name') and jsonb_typeof(p_values->(field->>'name'))<>'string' then raise exception '신청 항목은 문자열이어야 합니다.' using errcode='22023'; end if;
        value:=trim(coalesce(p_values->>(field->>'name'),''));
        if value='' then
            if coalesce((field->>'required')::boolean,false) then raise exception '% 항목을 입력해 주세요.',field->>'label' using errcode='22023'; end if;
            continue;
        end if;
        if length(value)>coalesce((field->>'maxLength')::integer,5000) then raise exception '% 항목이 너무 깁니다.',field->>'label' using errcode='22023'; end if;
        if field->>'type'='email' and value!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception '이메일 주소를 확인해 주세요.' using errcode='22023'; end if;
        if field->>'type'='tel' and value!~'^[+0-9()[:space:]-]{8,30}$' then raise exception '연락처를 확인해 주세요.' using errcode='22023'; end if;
        if field->>'type'='number' then
            if value!~'^[0-9]{1,12}$' then raise exception '인원·금액은 정수로 입력해 주세요.' using errcode='22023'; end if;
            if value::numeric<coalesce((field->>'min')::numeric,0) or value::numeric>coalesce((field->>'max')::numeric,1000000000) then raise exception '인원·금액의 범위를 확인해 주세요.' using errcode='22023'; end if;
        end if;
        if field->>'type'='date' then
            if value!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or not pg_input_is_valid(value,'date') then raise exception '날짜를 확인해 주세요.' using errcode='22023'; end if;
        end if;
        if field->>'type'='select' and not exists(select 1 from jsonb_array_elements(field->'options') as allowed_option(definition) where allowed_option.definition->>'value'=value) then raise exception '목록에서 항목을 선택해 주세요.' using errcode='22023'; end if;
        if field->>'name'='portfolio' and value!~'^https?://' then raise exception '포트폴리오 주소를 확인해 주세요.' using errcode='22023'; end if;
    end loop;
    if nullif(trim(p_values->>'endDate'),'') is not null and nullif(trim(p_values->>'date'),'') is not null and trim(p_values->>'endDate')::date<trim(p_values->>'date')::date then raise exception '종료일은 시작일 이후로 선택해 주세요.' using errcode='22023'; end if;
    if (select count(*) from public.sejong_service_requests where user_id=owner and created_at>now()-interval '1 hour')>=20 then raise exception '신청이 많습니다. 잠시 후 다시 시도해 주세요.' using errcode='54000'; end if;
    final_values:=p_values;
    if f.kind='order' then
        perform 1 from public.sejong_service_cart where user_id=owner for update;
        perform 1 from public.sejong_service_goods g join public.sejong_service_cart c on c.good_id=g.id where c.user_id=owner for share of g;
        select count(*),jsonb_agg(jsonb_build_object('id',g.id,'title',g.title,'quantity',c.quantity,'unitPrice',g.price) order by g.sort_order),
          case when bool_and(g.price is not null) then sum(g.price::bigint*c.quantity) else null end
          into cart_count,items,total from public.sejong_service_cart c join public.sejong_service_goods g on g.id=c.good_id
          where c.user_id=owner and c.updated_at>now()-interval '90 days' and g.published;
        if cart_count=0 then raise exception '장바구니에 상품을 담아 주세요.' using errcode='22023'; end if;
        if cart_count<>(select count(*) from public.sejong_service_cart where user_id=owner) then raise exception '상품 목록이 변경되었습니다. 장바구니를 다시 확인해 주세요.' using errcode='22023'; end if;
        final_values:=p_values||jsonb_build_object('items',items,'total',total,'paymentStatus','unpaid');
    end if;
    insert into public.sejong_service_requests(user_id,form_id,kind,request_key,input_hash,values,form_revision)
      values(owner,f.id,f.kind,p_request_key,fingerprint,final_values,f.revision) returning * into r;
    if f.kind='order' then delete from public.sejong_service_cart where user_id=owner; end if;
    return jsonb_build_object('id',r.id,'reference',r.reference,'form_id',r.form_id,'kind',r.kind,'status',r.status,'values',r.values,'created_at',r.created_at,'expires_at',r.expires_at);
end $$;

-- [본인 취소와 장바구니 / Owner cancellation and server-controlled cart]
create function public.cancel_sejong_request(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.sejong_service_requests; owner uuid:=auth.uid();
begin
    if owner is null then raise exception '로그인이 필요합니다.' using errcode='28000'; end if;
    perform pg_advisory_xact_lock(hashtextextended(owner::text,90431));
    update public.sejong_service_requests set status='cancelled',cancelled_at=coalesce(cancelled_at,now())
      where id=p_id and user_id=owner and expires_at>now() returning * into r;
    if not found then raise exception '신청 내역을 확인할 수 없습니다.' using errcode='42501'; end if;
    return jsonb_build_object('id',r.id,'reference',r.reference,'form_id',r.form_id,'kind',r.kind,'status',r.status,'values',r.values,'created_at',r.created_at,'expires_at',r.expires_at);
end $$;
create function public.set_sejong_cart_quantity(p_good_id text,p_quantity integer,p_increment boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); current_quantity integer; final_quantity integer;
begin
    if owner is null then raise exception '로그인이 필요합니다.' using errcode='28000'; end if;
    if p_increment is null or p_quantity is null or p_quantity<0 or p_quantity>20 then raise exception '수량은 0~20개로 입력해 주세요.' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended(owner::text,90431));
    final_quantity:=p_quantity;
    if p_increment then
        select quantity into current_quantity from public.sejong_service_cart where user_id=owner and good_id=p_good_id and updated_at>now()-interval '90 days';
        final_quantity:=coalesce(current_quantity,0)+p_quantity;
        if final_quantity>20 then raise exception '수량은 최대 20개까지 담을 수 있습니다.' using errcode='22023'; end if;
    end if;
    if final_quantity=0 then delete from public.sejong_service_cart where user_id=owner and good_id=p_good_id; return; end if;
    if not exists(select 1 from public.sejong_service_goods where id=p_good_id and published) then raise exception '현재 선택할 수 없는 상품입니다.' using errcode='22023'; end if;
    if not exists(select 1 from public.sejong_service_cart where user_id=owner and good_id=p_good_id and updated_at>now()-interval '90 days')
      and (select count(*) from public.sejong_service_cart where user_id=owner and updated_at>now()-interval '90 days')>=20 then raise exception '장바구니에는 최대 20종류를 담을 수 있습니다.' using errcode='22023'; end if;
    insert into public.sejong_service_cart(user_id,good_id,quantity) values(owner,p_good_id,final_quantity)
      on conflict(user_id,good_id) do update set quantity=excluded.quantity,updated_at=now();
end $$;
revoke all on function public.submit_sejong_request(text,uuid,jsonb),public.cancel_sejong_request(uuid),public.set_sejong_cart_quantity(text,integer,boolean) from public,anon;
grant execute on function public.submit_sejong_request(text,uuid,jsonb),public.cancel_sejong_request(uuid),public.set_sejong_cart_quantity(text,integer,boolean) to authenticated;

-- [보관 기한을 실제 작업으로 집행 / Enforce retention with an actual scheduled job]
create extension if not exists pg_cron with schema pg_catalog;
create function sejong_private.purge_service_data() returns void language sql security definer set search_path='' as $$
    delete from public.sejong_service_requests where expires_at<=now();
    delete from public.sejong_service_cart where updated_at<=now()-interval '90 days';
$$;
revoke all on function sejong_private.purge_service_data() from public,anon,authenticated;
select cron.schedule('sejong-service-retention','17 * * * *','select sejong_private.purge_service_data()');
