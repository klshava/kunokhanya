-- The WordPress form is actually a full application, not just a contact
-- form -- it also collects ID/passport number, date of birth, gender,
-- physical address, and a study-mode/intake-month preference. These were
-- being submitted but discarded (the webhook only ever mapped
-- full_name/email/contact_number/course_interested). Storing them now so
-- converting a lead to a student can be pre-filled instead of retyped.
alter table public.website_leads
  add column if not exists id_number text,
  add column if not exists date_of_birth date,
  add column if not exists gender gender_t,
  add column if not exists physical_address text,
  add column if not exists study_mode study_mode_t,
  add column if not exists intake_month text;

alter table public.website_leads drop constraint if exists website_leads_intake_month_check;
alter table public.website_leads add constraint website_leads_intake_month_check
  check (intake_month is null or intake_month in (
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ));
