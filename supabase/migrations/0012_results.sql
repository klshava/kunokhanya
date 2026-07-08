-- Results tracking (Competent / Not Yet Competent per module/unit standard,
-- multiple per course). Any staff role can record/edit results; students can
-- read only their own, via the portal.
create type result_outcome_t as enum ('competent', 'not_yet_competent');

create table if not exists public.results (
  result_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (student_id) on delete cascade,
  course_id uuid references public.courses (course_id) on delete set null,
  module_name text not null,
  outcome result_outcome_t not null,
  notes text,
  assessed_date date not null default current_date,
  marked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists results_student_idx on public.results (student_id);
create index if not exists results_course_idx on public.results (course_id);

comment on table public.results is 'One row per assessed module/unit standard per student. course_id is captured at assessment time (not re-derived from the student record), so it stays accurate even if the student later changes course.';

drop trigger if exists trg_results_updated_at on public.results;
create trigger trg_results_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();

alter table public.results enable row level security;

grant select, insert, update, delete on public.results to authenticated, service_role;

drop policy if exists "results_staff_all" on public.results;
create policy "results_staff_all" on public.results for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "results_select_own" on public.results;
create policy "results_select_own" on public.results for select
  using (student_id = public.my_linked_student_id());
