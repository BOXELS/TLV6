-- Show tables with RLS status
SELECT 
    n.nspname as schema,
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'  -- Only show regular tables
ORDER BY schema, table_name; 