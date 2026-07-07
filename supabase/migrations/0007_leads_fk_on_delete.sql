-- website_leads.converted_student_id was missing "on delete set null" (unlike
-- profiles.linked_student_id, which already has it), so deleting a student
-- who was converted from a lead failed with a foreign key violation instead
-- of just clearing the link.
alter table public.website_leads
  drop constraint if exists website_leads_converted_student_id_fkey;

alter table public.website_leads
  add constraint website_leads_converted_student_id_fkey
  foreign key (converted_student_id) references public.students (student_id)
  on delete set null;
