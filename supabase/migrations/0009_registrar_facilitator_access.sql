-- Registrar + Facilitator access: profiles.linked_staff_id, role-check
-- helpers, updated RLS across courses/students/staff/payments/leads, and a
-- non-financial students_directory view for facilitators.
--
-- Requires 0008_role_enum_registrar_facilitator.sql to have already been run
-- (and completed) in a separate transaction before this file.

-- ----------------------------------------------------------------------------
-- profiles.linked_staff_id: mirrors linked_student_id, links a login to an
-- existing staff record (used by the admin-only "Manage Users" feature). A
-- staff member should only ever be linked to one login, hence the unique
-- partial index.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists linked_staff_id uuid references public.staff (staff_id) on delete set null;

create unique index if not exists profiles_linked_staff_id_key
  on public.profiles (linked_staff_id)
  where linked_staff_id is not null;

comment on column public.profiles.linked_staff_id is
  'For registrar/facilitator/admin logins created via Manage Users: the staff record this login belongs to.';

-- ----------------------------------------------------------------------------
-- Role-check helpers (SECURITY DEFINER, same pattern as the existing is_admin()).
-- ----------------------------------------------------------------------------
create or replace function public.is_registrar()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'registrar'
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.is_facilitator()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'facilitator'
  );
$$ language sql stable security definer set search_path = public;

-- Convenience used across most write policies below (admin OR registrar).
create or replace function public.is_admin_or_registrar()
returns boolean as $$
  select public.is_admin() or public.is_registrar();
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- courses: read unchanged (any authenticated user); write admin+registrar.
-- ----------------------------------------------------------------------------
drop policy if exists "courses_write" on public.courses;
create policy "courses_write" on public.courses for all
  using (public.is_admin_or_registrar()) with check (public.is_admin_or_registrar());

-- ----------------------------------------------------------------------------
-- students: base table SELECT/write deliberately EXCLUDES facilitator (they
-- must use students_directory below, which has no financial columns). This
-- is the crux of enforcing "no financial data" at the DB level: a
-- facilitator's JWT gets zero rows from this table, even via a raw API call.
-- ----------------------------------------------------------------------------
drop policy if exists "students_select" on public.students;
create policy "students_select" on public.students for select
  using (public.is_admin_or_registrar() or student_id = public.my_linked_student_id());

drop policy if exists "students_admin_write" on public.students;
create policy "students_admin_write" on public.students for all
  using (public.is_admin_or_registrar()) with check (public.is_admin_or_registrar());

-- ----------------------------------------------------------------------------
-- students_directory: non-financial columns only, for facilitators (also
-- usable by admin/registrar/self). Deliberately NOT security_invoker: it must
-- run with the view owner's privileges so it can read public.students even
-- for a facilitator, whom the base table's policy above excludes entirely.
-- All row-level filtering therefore happens explicitly in this view's WHERE
-- clause. Never add total_fee_override, registration_fee_override, or
-- registration_fee_paid to this view.
-- ----------------------------------------------------------------------------
create or replace view public.students_directory as
select
  s.student_id,
  s.student_number,
  s.full_name,
  s.id_number,
  s.date_of_birth,
  s.gender,
  s.contact_number,
  s.email,
  s.physical_address,
  s.emergency_contact_name,
  s.emergency_contact_number,
  s.course_id,
  c.course_name,
  s.study_mode,
  s.enrollment_date,
  s.status,
  s.source,
  s.intake_month,
  s.created_at,
  s.updated_at
from public.students s
left join public.courses c on c.course_id = s.course_id
where
  public.is_admin_or_registrar()
  or public.is_facilitator()
  or s.student_id = public.my_linked_student_id();

comment on view public.students_directory is
  'Non-financial student fields only, for facilitators. Deliberately not security_invoker -- see comment above the view. Never add total_fee_override, registration_fee_override, or registration_fee_paid here.';

grant select on public.students_directory to authenticated;

-- ----------------------------------------------------------------------------
-- staff, website_leads: admin+registrar only (facilitator gets zero access).
-- ----------------------------------------------------------------------------
drop policy if exists "staff_admin_only" on public.staff;
create policy "staff_admin_or_registrar" on public.staff for all
  using (public.is_admin_or_registrar()) with check (public.is_admin_or_registrar());

drop policy if exists "leads_admin_only" on public.website_leads;
create policy "leads_admin_or_registrar" on public.website_leads for all
  using (public.is_admin_or_registrar()) with check (public.is_admin_or_registrar());

-- ----------------------------------------------------------------------------
-- payments: registrar joins admin; facilitator is never mentioned -- zero
-- rows, enforced at the DB level.
-- ----------------------------------------------------------------------------
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select
  using (public.is_admin_or_registrar() or student_id = public.my_linked_student_id());

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments for all
  using (public.is_admin_or_registrar()) with check (public.is_admin_or_registrar());

-- ----------------------------------------------------------------------------
-- profiles: writes remain admin-ONLY (unchanged) -- registrar must not
-- create or edit other accounts. Read stays "own row or admin".
--
-- student_balances view: left as-is (security_invoker = true, unchanged).
-- Because it is security_invoker, a facilitator querying it re-checks RLS on
-- students/courses/payments as themselves and gets zero rows -- no financial
-- leak, no changes needed to that view.
-- ----------------------------------------------------------------------------
