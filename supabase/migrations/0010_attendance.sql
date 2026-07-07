-- Attendance tracking. Any staff role (admin/registrar/facilitator) can mark
-- and edit attendance; students have no access at all, not even to their own
-- record, per the current requirement -- this can be relaxed later if a
-- student-facing view is ever wanted.
create table if not exists public.attendance (
  attendance_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (student_id) on delete cascade,
  attendance_date date not null,
  present boolean not null default false,
  marked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_student_date_key unique (student_id, attendance_date)
);

create index if not exists attendance_student_idx on public.attendance (student_id);
create index if not exists attendance_date_idx on public.attendance (attendance_date);

comment on table public.attendance is 'One row per student per day. present=false rows exist once a day has been explicitly ticked as absent (vs. never marked at all).';

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

alter table public.attendance enable row level security;

grant select, insert, update, delete on public.attendance to authenticated, service_role;

-- "Any staff member, not a student" -- reusable for future staff-wide (but
-- not student-facing) features.
create or replace function public.is_staff()
returns boolean as $$
  select public.is_admin() or public.is_registrar() or public.is_facilitator();
$$ language sql stable security definer set search_path = public;

drop policy if exists "attendance_staff_only" on public.attendance;
create policy "attendance_staff_only" on public.attendance for all
  using (public.is_staff()) with check (public.is_staff());
