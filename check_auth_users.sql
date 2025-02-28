-- Check auth.users table for the correct ID
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'jareds.smith@gmail.com';

-- Also show recent users from auth schema
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if user_type_assignments table exists and its structure
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_type_assignments'
); 