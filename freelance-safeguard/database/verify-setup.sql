-- Verify that the waitlist table exists and has the correct structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'waitlist'
ORDER BY 
  ordinal_position;

-- Verify that RLS is enabled on the waitlist table
SELECT
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  tablename = 'waitlist';

-- List all policies on the waitlist table
SELECT
  schemaname,
  tablename,
  policyname AS policy_name,
  cmd AS command,
  permissive
FROM
  pg_policies
WHERE
  tablename = 'waitlist';
