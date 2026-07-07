-- Adds 'registrar' and 'facilitator' to user_role.
--
-- IMPORTANT: run this file ALONE, as its own paste/run in the Supabase SQL
-- Editor. ALTER TYPE ... ADD VALUE cannot safely be used in the same
-- transaction as statements that reference the new value (helper functions,
-- RLS policies, etc. live in the NEXT migration file, 0009). Run 0009
-- separately, after this one has completed.
alter type user_role add value if not exists 'registrar';
alter type user_role add value if not exists 'facilitator';
