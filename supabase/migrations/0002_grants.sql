-- ============================================================================
-- Fix: 0001_init.sql created tables and RLS policies but never granted the
-- base table privileges that PostgREST needs to even attempt a query as
-- anon/authenticated/service_role. Without these grants every request fails
-- with "permission denied for table X" before RLS is ever evaluated, which
-- the app layouts mistook for "no matching profile" and bounced between
-- /admin and /portal forever.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
