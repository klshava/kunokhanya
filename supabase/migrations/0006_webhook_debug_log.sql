-- Captures the raw payload of any webhook request to /api/leads/webhook that
-- doesn't match a known field mapping, since some WordPress form plugins
-- (e.g. Forminator) send fixed internal field codes instead of letting you
-- rename fields. Useful again if a new form is ever connected.
create table if not exists public.webhook_debug_log (
  id uuid primary key default gen_random_uuid(),
  payload jsonb,
  received_at timestamptz not null default now()
);

grant select, insert, delete on public.webhook_debug_log to service_role;
