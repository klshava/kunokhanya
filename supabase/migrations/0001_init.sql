-- Kunokhanya Training Academy - initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push` if you use the CLI).
-- Safe to re-run: guards with IF NOT EXISTS / OR REPLACE where possible.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
do $$ begin
  create type user_role as enum ('admin', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type study_mode_t as enum ('full-time', 'part-time');
exception when duplicate_object then null; end $$;

do $$ begin
  create type student_status_t as enum ('active', 'completed', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type student_source_t as enum ('walk-in', 'website', 'referral', 'wordpress');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status_t as enum ('new', 'contacted', 'converted', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_t as enum ('male', 'female', 'other', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABLE: courses
-- ============================================================================
create table if not exists public.courses (
  course_id uuid primary key default gen_random_uuid(),
  course_name text not null,
  duration_months integer,
  registration_fee numeric(10, 2) not null default 0,
  monthly_fee numeric(10, 2) not null default 0,
  total_fee numeric(10, 2) not null default 0,
  study_mode study_mode_t,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.courses is 'Programmes / courses offered by the academy.';

-- ============================================================================
-- TABLE: students
-- ============================================================================
create table if not exists public.students (
  student_id uuid primary key default gen_random_uuid(),
  student_number text unique, -- e.g. KTA260001, auto-generated on creation
  full_name text not null,
  id_number text not null,
  date_of_birth date,
  gender gender_t,
  contact_number text,
  email text,
  physical_address text,
  emergency_contact_name text,
  emergency_contact_number text,
  course_id uuid references public.courses (course_id),
  study_mode study_mode_t not null default 'full-time',
  enrollment_date date not null default current_date,
  status student_status_t not null default 'active',
  source student_source_t not null default 'walk-in',
  registration_fee_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists students_id_number_key on public.students (id_number);
create index if not exists students_full_name_idx on public.students using gin (to_tsvector('simple', full_name));
create index if not exists students_course_idx on public.students (course_id);
create index if not exists students_status_idx on public.students (status);

comment on table public.students is 'Core student records.';

-- ============================================================================
-- TABLE: staff
-- ============================================================================
create table if not exists public.staff (
  staff_id uuid primary key default gen_random_uuid(),
  title text,
  first_name text not null,
  last_name text not null,
  position text,
  phone_number text,
  email text,
  id_number text,
  nationality text,
  address text,
  next_of_kin_name text,
  next_of_kin_number text,
  date_of_birth date,
  gender gender_t,
  home_language text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.staff is 'Staff / employee records (admin managed, no portal login in v1).';

-- ============================================================================
-- TABLE: payments
-- ============================================================================
create table if not exists public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (student_id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text,
  receipt_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_student_idx on public.payments (student_id);

comment on table public.payments is 'Payment / receipt log against a student.';

-- ============================================================================
-- TABLE: website_leads
-- ============================================================================
create table if not exists public.website_leads (
  lead_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  contact_number text,
  course_interested text,
  submitted_at timestamptz not null default now(),
  status lead_status_t not null default 'new',
  source text not null default 'wordpress_form',
  converted_student_id uuid references public.students (student_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.website_leads is 'Leads captured from the public WordPress site, imported via webhook.';

-- ============================================================================
-- TABLE: profiles (links a Supabase Auth user to a role + optional student)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  linked_student_id uuid references public.students (student_id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Maps an authenticated user to a role and (for students) their student record.';

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['courses', 'students', 'staff', 'website_leads', 'profiles'] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ============================================================================
-- Auto student_number generator, e.g. KTA260001 (KTA + 2-digit year + 4-digit seq)
-- ============================================================================
create or replace function public.generate_student_number()
returns trigger as $$
declare
  yy text;
  next_seq int;
  candidate text;
begin
  if new.student_number is not null then
    return new;
  end if;

  yy := to_char(coalesce(new.enrollment_date, current_date), 'YY');

  select coalesce(max(substring(student_number from 6)::int), 0) + 1
    into next_seq
  from public.students
  where student_number like 'KTA' || yy || '%';

  candidate := 'KTA' || yy || lpad(next_seq::text, 4, '0');
  new.student_number := candidate;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_student_number on public.students;
create trigger trg_generate_student_number
  before insert on public.students
  for each row execute function public.generate_student_number();

-- ============================================================================
-- Helper: is the current user an admin? (SECURITY DEFINER avoids RLS recursion)
-- ============================================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.my_linked_student_id()
returns uuid as $$
  select linked_student_id from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.staff enable row level security;
alter table public.payments enable row level security;
alter table public.website_leads enable row level security;
alter table public.profiles enable row level security;

-- courses: any signed-in user can read; only admins can write
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select
  using (auth.role() = 'authenticated');

drop policy if exists "courses_write" on public.courses;
create policy "courses_write" on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

-- students: admins see/edit all; a student can see only their own row
drop policy if exists "students_select" on public.students;
create policy "students_select" on public.students for select
  using (public.is_admin() or student_id = public.my_linked_student_id());

drop policy if exists "students_admin_write" on public.students;
create policy "students_admin_write" on public.students for all
  using (public.is_admin()) with check (public.is_admin());

-- Students update their own contact-only fields through the RPC below (SECURITY DEFINER),
-- not through direct table UPDATE, so no student UPDATE policy is defined here on purpose.

-- staff: admin only
drop policy if exists "staff_admin_only" on public.staff;
create policy "staff_admin_only" on public.staff for all
  using (public.is_admin()) with check (public.is_admin());

-- payments: admin full access; student can read own payments only
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select
  using (public.is_admin() or student_id = public.my_linked_student_id());

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments for all
  using (public.is_admin()) with check (public.is_admin());

-- website_leads: admin only (inserts happen server-side via service role from the webhook route)
drop policy if exists "leads_admin_only" on public.website_leads;
create policy "leads_admin_only" on public.website_leads for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: a user can read their own profile; admins can read all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- RPC: a student updates only their own contact-type fields
-- ============================================================================
create or replace function public.update_my_student_contact(
  p_contact_number text default null,
  p_email text default null,
  p_physical_address text default null,
  p_emergency_contact_name text default null,
  p_emergency_contact_number text default null
)
returns public.students as $$
declare
  sid uuid;
  result public.students;
begin
  sid := public.my_linked_student_id();
  if sid is null then
    raise exception 'No linked student record for this account';
  end if;

  update public.students set
    contact_number = coalesce(p_contact_number, contact_number),
    email = coalesce(p_email, email),
    physical_address = coalesce(p_physical_address, physical_address),
    emergency_contact_name = coalesce(p_emergency_contact_name, emergency_contact_name),
    emergency_contact_number = coalesce(p_emergency_contact_number, emergency_contact_number)
  where student_id = sid
  returning * into result;

  return result;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- VIEW: student_balances (used by the Reports page for fast aggregates)
-- security_invoker means the view respects the querying user's own RLS
-- policies on students/courses/payments, rather than the view owner's.
-- ============================================================================
create or replace view public.student_balances
with (security_invoker = true) as
select
  s.student_id,
  s.status,
  s.course_id,
  coalesce(c.total_fee, 0) as total_fee,
  coalesce(p.total_paid, 0) as total_paid,
  coalesce(c.total_fee, 0) - coalesce(p.total_paid, 0) as balance
from public.students s
left join public.courses c on c.course_id = s.course_id
left join (
  select student_id, sum(amount) as total_paid
  from public.payments
  group by student_id
) p on p.student_id = s.student_id;

-- ============================================================================
-- Seed: a couple of starter courses (safe to delete/edit later from the app)
-- ============================================================================
insert into public.courses (course_name, duration_months, registration_fee, monthly_fee, total_fee, study_mode, is_active)
select * from (values
  ('Home-Based Care (HBC)', 6, 500.00, 650.00, 4400.00, 'full-time'::study_mode_t, true),
  ('Child and Youth Care (CHW)', 12, 750.00, 600.00, 8000.00, 'part-time'::study_mode_t, true)
) as seed(course_name, duration_months, registration_fee, monthly_fee, total_fee, study_mode, is_active)
where not exists (select 1 from public.courses);
