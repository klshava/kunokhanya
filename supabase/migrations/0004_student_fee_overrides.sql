-- ============================================================================
-- Historical fee amounts vary per student (by enrollment year and by
-- full-time/part-time study mode) rather than being one fixed number per
-- course. These optional overrides let a student's fee statement show their
-- actual historical total/registration fee instead of falling back to the
-- course-level rate card, which only represents "today's" going rate.
-- ============================================================================

alter table public.students add column if not exists total_fee_override numeric(10, 2);
alter table public.students add column if not exists registration_fee_override numeric(10, 2);
