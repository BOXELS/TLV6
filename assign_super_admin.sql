-- First, make sure we have the super_admin type
INSERT INTO user_types (name, code)
VALUES ('Super Admin', 'super_admin')
ON CONFLICT (code) DO NOTHING;

-- Get the type_id for super_admin
WITH super_admin_type AS (
    SELECT id FROM user_types WHERE code = 'super_admin'
)
INSERT INTO user_type_assignments (user_id, type_id)
VALUES (
    '4259afda-05ff-4679-aae2-fb87ccbdfea8',
    (SELECT id FROM super_admin_type)
)
ON CONFLICT (user_id, type_id) DO NOTHING;

-- Verify the assignment was created
SELECT 
    uta.id as assignment_id,
    uta.user_id,
    ut.id as type_id,
    ut.name as type_name,
    ut.code as type_code
FROM user_type_assignments uta
JOIN user_types ut ON ut.id = uta.type_id
WHERE uta.user_id = '4259afda-05ff-4679-aae2-fb87ccbdfea8'; 