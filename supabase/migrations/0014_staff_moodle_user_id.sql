-- Tracks the Moodle account created alongside a staff member's Student
-- Central login (see app/admin/users/actions.ts createStaffLoginAction),
-- mirroring students.moodle_user_id (0013). Null if Moodle isn't
-- configured, account creation failed, or no login has been granted yet.
-- Used to delete the Moodle account when access is revoked.
alter table public.staff add column if not exists moodle_user_id integer;

comment on column public.staff.moodle_user_id is
  'Moodle user id for this staff member''s Moodle account, created when a Student Central login is granted. Null if none exists.';
