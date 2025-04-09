-- Comprehensive verification script for FreelanceShield Supabase setup

-- 1. Verify waitlist table structure
SELECT 
  'Table Structure Check' as test,
  table_name, 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'waitlist'
ORDER BY 
  ordinal_position;

-- 2. Verify RLS is enabled
SELECT
  'RLS Status Check' as test,
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM
  pg_tables
WHERE
  tablename = 'waitlist';

-- 3. List all policies using the pg_policies view (safer than pg_policy)
SELECT
  'Policy Check' as test,
  schemaname,
  tablename,
  policyname AS policy_name,
  cmd AS command,
  roles,
  permissive
FROM
  pg_policies
WHERE
  tablename = 'waitlist';

-- 4. Check for unique constraints/indexes
SELECT
  'Unique Index Check' as test,
  tablename,
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  tablename = 'waitlist'
  AND indexdef LIKE '%UNIQUE%';

-- 5. Test anonymous insert permission (this should work with RLS)
DO $$
BEGIN
  -- Delete test record if it exists
  DELETE FROM waitlist WHERE email = 'test_verify@example.com';
  
  -- Insert test record
  INSERT INTO waitlist (email, source, tags)
  VALUES ('test_verify@example.com', 'verification_script', ARRAY['test']);
  
  RAISE NOTICE 'Successfully inserted test record as anonymous user';
  
  -- Clean up
  DELETE FROM waitlist WHERE email = 'test_verify@example.com';
END;
$$;
