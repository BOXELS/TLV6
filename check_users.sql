-- Check users table for the correct ID
SELECT 
    id,
    email,
    created_at
FROM users
WHERE email = 'jareds.smith@gmail.com';

-- Also show all users (in case email is different)
SELECT 
    id,
    email,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 5; 