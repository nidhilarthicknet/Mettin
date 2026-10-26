-- Mettin: shared app catalogue, cloud projects and MetPay operations.
create table if not exists public.mettin_created_apps (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(trim(title)) between 2 and 60),
 description text not null check(length(trim(description)) between 1 and 500),
 category text not null default 'Utility' check(category in ('Utility','Game','Productivity','Education','Creative','Other')),
 price_jp numeric(14,2) not null default 0 check(price_jp>=0 and price_jp<=10000000),
 app_code text not null default '' check(length(app_code)<=25000), status text not null default 'draft' check(status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.mettin_created_apps enable row level security;
revoke all on public.mettin_created_apps from public,anon,authenticated;
grant select on public.mettin_created_apps to anon,authenticated;
grant insert,update,delete on public.mettin_created_apps to authenticated;
drop policy if exists mettin_created_apps_read_published_or_owned on public.mettin_created_apps;
create policy mettin_created_apps_read_published_or_owned on public.mettin_created_apps for select to anon,authenticated
 using(status='published' or creator_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('owner','admin')));
drop policy if exists mettin_created_apps_insert_owned on public.mettin_created_apps;
create policy mettin_created_apps_insert_owned on public.mettin_created_apps for insert to authenticated with check(creator_id=(select auth.uid()));
drop policy if exists mettin_created_apps_update_owned on public.mettin_created_apps;
create policy mettin_created_apps_update_owned on public.mettin_created_apps for update to authenticated using(creator_id=(select auth.uid())) with check(creator_id=(select auth.uid()));
drop policy if exists mettin_created_apps_delete_owned on public.mettin_created_apps;
create policy mettin_created_apps_delete_owned on public.mettin_created_apps for delete to authenticated using(creator_id=(select auth.uid()));
create index if not exists mettin_created_apps_public_idx on public.mettin_created_apps(status,created_at desc);
create index if not exists mettin_created_apps_creator_idx on public.mettin_created_apps(creator_id,updated_at desc);

create table if not exists public.mettin_projects (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80),code text not null default '' check(length(code)<=25000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.mettin_projects enable row level security;
revoke all on public.mettin_projects from public,anon,authenticated;
grant select,insert,update,delete on public.mettin_projects to authenticated;
drop policy if exists mettin_projects_owner_all on public.mettin_projects;
create policy mettin_projects_owner_all on public.mettin_projects for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create index if not exists mettin_projects_user_updated_idx on public.mettin_projects(user_id,updated_at desc);

create table if not exists public.mettin_user_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,currency_code text not null default 'JP' check(currency_code in ('JP','INR','USD')),updated_at timestamptz not null default now()
);
alter table public.mettin_user_settings enable row level security;
revoke all on public.mettin_user_settings from public,anon,authenticated;
grant select,insert,update on public.mettin_user_settings to authenticated;
drop policy if exists mettin_settings_owner_all on public.mettin_user_settings;
create policy mettin_settings_owner_all on public.mettin_user_settings for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function public.mettin_metpay_transfer(p_recipient_username text,p_amount_jp numeric,p_metpay_password text)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $function$
declare u uuid:=auth.uid(); rid uuid; s public.profiles%rowtype; r public.profiles%rowtype; h text;
begin
 if u is null then raise exception 'Sign in to Metxon first.'; end if;
 if p_amount_jp is null or p_amount_jp<=0 or p_amount_jp>1000000000 then raise exception 'Enter a valid JP amount.'; end if;
 if p_recipient_username is null or length(trim(p_recipient_username))<3 then raise exception 'Enter a valid username.'; end if;
 select password_hash into h from public.metpay_passwords where user_id=u;
 if h is null then raise exception 'Create your MetPay password first.'; end if;
 if p_metpay_password is null or extensions.crypt(p_metpay_password,h)<>h then raise exception 'Incorrect MetPay password.'; end if;
 select id into rid from public.profiles where lower(username)=lower(trim(p_recipient_username)) limit 1;
 if rid is null then raise exception 'Recipient Metxon username was not found.'; end if;
 if rid=u then raise exception 'You cannot pay yourself.'; end if;
 perform id from public.profiles where id in(u,rid) order by id for update;
 select * into s from public.profiles where id=u; select * into r from public.profiles where id=rid;
 if coalesce(s.jp_balance,0)<p_amount_jp then raise exception 'Insufficient InstaPay balance.'; end if;
 update public.profiles set jp_balance=jp_balance-p_amount_jp,updated_at=now() where id=u;
 update public.profiles set jp_balance=jp_balance+p_amount_jp,updated_at=now() where id=rid;
 insert into public.transactions(user_id,type,amount,note) values(u,'MetPay transfer out',-p_amount_jp,'Paid π'||p_amount_jp||' to '||r.username),(rid,'MetPay transfer in',p_amount_jp,'Received π'||p_amount_jp||' from '||s.username);
 insert into public.metxon_jp_transactions(user_id,amount,transaction_type,note) values(u,-p_amount_jp,'debit','MetPay to '||r.username),(rid,p_amount_jp,'credit','MetPay from '||s.username);
 return jsonb_build_object('ok',true,'recipient',r.username,'amount_jp',p_amount_jp);
end;$function$;
revoke all on function public.mettin_metpay_transfer(text,numeric,text) from public,anon;
grant execute on function public.mettin_metpay_transfer(text,numeric,text) to authenticated;

create or replace function public.mettin_install_nebula_app(p_app_id text,p_metpay_password text)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $function$
declare u uuid:=auth.uid(); oid uuid; nm text; price_inr numeric; price_jp numeric; h text; p public.profiles%rowtype; iid uuid;
begin
 if u is null then raise exception 'Sign in to Metxon first.'; end if;
 nm:=case p_app_id when 'met_develop' then 'MetDevelop' when 'cule_in' then 'Cule-In' when 'nebula_ai' then 'Nebula AI' when 'met_alk' then 'Met-Alk' when 'block_breaker' then 'Block Breaker' when 'football' then 'Football' when 'chess_boys' then 'Chess Boys' when 'metpay' then 'MetPay' else null end;
 price_inr:=case p_app_id when 'met_develop' then 20000 when 'cule_in' then 1000 when 'nebula_ai' then 10000 when 'met_alk' then 15000 when 'block_breaker' then 500 when 'football' then 200 when 'chess_boys' then 10000 when 'metpay' then 1000 else null end;
 if nm is null or price_inr is null then raise exception 'App is not available.'; end if;
 select password_hash into h from public.metpay_passwords where user_id=u;
 if h is null then raise exception 'Create your MetPay password first.'; end if;
 if p_metpay_password is null or extensions.crypt(p_metpay_password,h)<>h then raise exception 'Incorrect MetPay password.'; end if;
 select * into p from public.profiles where id=u for update;
 if exists(select 1 from public.metxon_app_installations where user_id=u and app_id=p_app_id) then return jsonb_build_object('installed',true,'charged',false,'app_id',p_app_id,'app_name',nm); end if;
 price_jp:=round(price_inr/100,2);
 if coalesce(p.jp_balance,0)<price_jp then raise exception 'Insufficient InstaPay balance. Required: π%',price_jp; end if;
 select id into oid from public.profiles where role='owner' order by created_at limit 1;
 if oid is null then raise exception 'Metxon owner account is not configured.'; end if;
 update public.profiles set jp_balance=jp_balance-price_jp,updated_at=now() where id=u;
 if oid<>u then update public.profiles set jp_balance=jp_balance+price_jp,updated_at=now() where id=oid; end if;
 insert into public.metxon_app_installations(user_id,app_id,app_name,price) values(u,p_app_id,nm,price_inr) returning id into iid;
 insert into public.transactions(user_id,type,amount,note) values(u,'Nebula Store install (MetPay)',-price_jp,nm||'; one-time price ₹'||price_inr);
 insert into public.metxon_jp_transactions(user_id,amount,transaction_type,note) values(u,-price_jp,'debit','Nebula Store installation: '||nm);
 if oid<>u then insert into public.transactions(user_id,type,amount,note) values(oid,'Nebula Store revenue',price_jp,'MetPay installation revenue: '||nm);
 insert into public.metxon_jp_transactions(user_id,amount,transaction_type,note) values(oid,price_jp,'credit','Nebula Store revenue: '||nm); end if;
 return jsonb_build_object('installed',true,'charged',true,'app_id',p_app_id,'app_name',nm,'price_inr',price_inr,'price_jp',price_jp,'installation_id',iid);
end;$function$;
revoke all on function public.mettin_install_nebula_app(text,text) from public,anon;
grant execute on function public.mettin_install_nebula_app(text,text) to authenticated;

create or replace function public.mettin_install_created_app(p_app_id uuid,p_metpay_password text)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $function$
declare u uuid:=auth.uid(); a public.mettin_created_apps%rowtype; h text; p public.profiles%rowtype; price numeric; appkey text; iid uuid;
begin
 if u is null then raise exception 'Sign in to Metxon first.'; end if;
 select * into a from public.mettin_created_apps where id=p_app_id and status='published';
 if a.id is null then raise exception 'App is not published or is unavailable.'; end if;
 appkey:='mettin_custom:'||a.id::text;
 select * into p from public.profiles where id=u for update;
 if exists(select 1 from public.metxon_app_installations where user_id=u and app_id=appkey) then return jsonb_build_object('installed',true,'charged',false,'app_id',appkey,'app_name',a.title); end if;
 price:=a.price_jp;
 if price>0 and a.creator_id<>u then
  select password_hash into h from public.metpay_passwords where user_id=u;
  if h is null then raise exception 'Create your MetPay password first.'; end if;
  if p_metpay_password is null or extensions.crypt(p_metpay_password,h)<>h then raise exception 'Incorrect MetPay password.'; end if;
  if coalesce(p.jp_balance,0)<price then raise exception 'Insufficient InstaPay balance. Required: π%',price; end if;
  perform id from public.profiles where id in(u,a.creator_id) order by id for update;
  update public.profiles set jp_balance=jp_balance-price,updated_at=now() where id=u;
  update public.profiles set jp_balance=jp_balance+price,updated_at=now() where id=a.creator_id;
  insert into public.transactions(user_id,type,amount,note) values(u,'Nebula custom app (MetPay)',-price,'Bought '||a.title),(a.creator_id,'Nebula custom app revenue',price,'Sale of '||a.title);
  insert into public.metxon_jp_transactions(user_id,amount,transaction_type,note) values(u,-price,'debit','Nebula custom app: '||a.title),(a.creator_id,price,'credit','Nebula custom app sale: '||a.title);
 end if;
 insert into public.metxon_app_installations(user_id,app_id,app_name,price) values(u,appkey,a.title,price*100) returning id into iid;
 return jsonb_build_object('installed',true,'charged',price>0 and a.creator_id<>u,'app_id',appkey,'app_name',a.title,'price_jp',price,'installation_id',iid);
end;$function$;
revoke all on function public.mettin_install_created_app(uuid,text) from public,anon;
grant execute on function public.mettin_install_created_app(uuid,text) to authenticated;
