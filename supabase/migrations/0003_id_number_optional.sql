-- ============================================================================
-- Historical student records (bulk import from the pre-app Excel database)
-- don't all have a captured ID number. Relax the NOT NULL requirement so
-- these can still be imported; the admin form can still be told to require
-- it for newly-registered students going forward.
-- ============================================================================

alter table public.students alter column id_number drop not null;
