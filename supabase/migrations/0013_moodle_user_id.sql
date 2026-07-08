-- Tracks the Moodle user id created alongside a student's Student Central
-- login, so deleting the student here can also delete their Moodle account.
alter table public.students add column if not exists moodle_user_id integer;

comment on column public.students.moodle_user_id is
  'Moodle user id (from core_user_create_users) for the matching LMS account, if one was created. Used to delete it too when the student is deleted here.';
