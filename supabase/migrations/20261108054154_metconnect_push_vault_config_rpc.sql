create or replace function public.metconnect_get_push_config()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_object_agg(d.name, d.decrypted_secret)
  from vault.decrypted_secrets d
  where d.name in (
    'metconnect_vapid_public_v3',
    'metconnect_vapid_private_v3',
    'metconnect_push_hook_secret_v3'
  );
$$;

revoke all on function public.metconnect_get_push_config() from public, anon, authenticated;
grant execute on function public.metconnect_get_push_config() to service_role;
