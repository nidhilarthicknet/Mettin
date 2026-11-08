create table if not exists public.metconnect_push_subscriptions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null check (endpoint like 'https://%'),
  subscription jsonb not null check (jsonb_typeof(subscription) = 'object'),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

create index if not exists metconnect_push_subscriptions_user_id_idx
  on public.metconnect_push_subscriptions(user_id);

alter table public.metconnect_push_subscriptions enable row level security;

drop policy if exists metconnect_push_subscriptions_select_own on public.metconnect_push_subscriptions;
create policy metconnect_push_subscriptions_select_own
  on public.metconnect_push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists metconnect_push_subscriptions_insert_own on public.metconnect_push_subscriptions;
create policy metconnect_push_subscriptions_insert_own
  on public.metconnect_push_subscriptions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists metconnect_push_subscriptions_update_own on public.metconnect_push_subscriptions;
create policy metconnect_push_subscriptions_update_own
  on public.metconnect_push_subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists metconnect_push_subscriptions_delete_own on public.metconnect_push_subscriptions;
create policy metconnect_push_subscriptions_delete_own
  on public.metconnect_push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.metconnect_push_subscriptions from public, anon;
grant select, insert, update, delete on public.metconnect_push_subscriptions to authenticated;
grant all on public.metconnect_push_subscriptions to service_role;

create or replace function metconnect_private.notify_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_payload jsonb;
begin
  if TG_TABLE_NAME = 'metconnect_calls' then
    if NEW.status <> 'ringing' then
      return NEW;
    end if;
    v_payload := pg_catalog.jsonb_build_object('type', 'call', 'record_id', NEW.id);
  elsif TG_TABLE_NAME = 'metconnect_messages' then
    v_payload := pg_catalog.jsonb_build_object('type', 'message', 'record_id', NEW.id);
  else
    return NEW;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'metconnect_push_hook_secret_v3'
  limit 1;

  if v_secret is null or v_secret = '' then
    raise warning 'MetConnect push secret is not configured';
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://brahcvovidgjjzpkxsms.supabase.co/functions/v1/metconnect-push',
    body := v_payload,
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'x-metconnect-hook', v_secret
    ),
    timeout_milliseconds := 4000
  );

  return NEW;
exception when others then
  raise warning 'MetConnect push dispatch failed: %', SQLERRM;
  return NEW;
end;
$$;

revoke all on function metconnect_private.notify_push() from public, anon, authenticated;

drop trigger if exists metconnect_push_call_insert on public.metconnect_calls;
create trigger metconnect_push_call_insert
  after insert on public.metconnect_calls
  for each row execute function metconnect_private.notify_push();

drop trigger if exists metconnect_push_message_insert on public.metconnect_messages;
create trigger metconnect_push_message_insert
  after insert on public.metconnect_messages
  for each row execute function metconnect_private.notify_push();
