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
    if TG_OP = 'INSERT' and NEW.status = 'ringing' then
      v_payload := pg_catalog.jsonb_build_object('type', 'call', 'record_id', NEW.id);
    elsif TG_OP = 'UPDATE' and OLD.status = 'ringing' and NEW.status <> 'ringing' then
      v_payload := pg_catalog.jsonb_build_object('type', 'call_update', 'record_id', NEW.id);
    else
      return NEW;
    end if;
  elsif TG_TABLE_NAME = 'metconnect_messages' and TG_OP = 'INSERT' then
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

drop trigger if exists metconnect_push_call_status_update on public.metconnect_calls;
create trigger metconnect_push_call_status_update
  after update of status on public.metconnect_calls
  for each row execute function metconnect_private.notify_push();
