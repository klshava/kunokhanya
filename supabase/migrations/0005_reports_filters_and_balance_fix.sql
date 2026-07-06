-- ============================================================================
-- Historical students (bulk import from the pre-app Excel database) each had
-- an intake month (e.g. "February", "July") that was never persisted. This
-- adds the column so it can be backfilled for existing records and captured
-- going forward via the registration form.
-- ============================================================================
alter table public.students add column if not exists intake_month text;

comment on column public.students.intake_month is
  'Intake month captured at enrollment (e.g. ''February'', ''July''). Nullable.';

alter table public.students drop constraint if exists students_intake_month_check;
alter table public.students add constraint students_intake_month_check
  check (intake_month is null or intake_month in (
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ));

create index if not exists students_intake_month_idx on public.students (intake_month);

-- ============================================================================
-- Bug fix: student_balances ignored total_fee_override, so every historical
-- student's outstanding balance was computed against the flat course rate
-- instead of their actual historical total. total_fee_override must win,
-- matching the priority already used in every fee-statement page.
-- ============================================================================
create or replace view public.student_balances
with (security_invoker = true) as
select
  s.student_id,
  s.status,
  s.course_id,
  coalesce(s.total_fee_override, c.total_fee, 0) as total_fee,
  coalesce(p.total_paid, 0) as total_paid,
  coalesce(s.total_fee_override, c.total_fee, 0) - coalesce(p.total_paid, 0) as balance
from public.students s
left join public.courses c on c.course_id = s.course_id
left join (
  select student_id, sum(amount) as total_paid
  from public.payments
  group by student_id
) p on p.student_id = s.student_id;
