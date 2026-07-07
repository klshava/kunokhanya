-- Temporary table to inspect the raw payload WordPress form plugins actually
-- send to /api/leads/webhook, since some (e.g. Forminator) don't let you
-- rename fields to match our expected JSON keys. Safe to drop once the
-- mapping is confirmed working -- see 0007_drop_webhook_debug_log.sql.
create table if not exists public.webhook_debug_log (
  id uuid primary key default gen_random_uuid(),
  payload jsonb,
  received_at timestamptz not null default now()
);

grant select, insert, delete on public.webhook_debug_log to service_role;
