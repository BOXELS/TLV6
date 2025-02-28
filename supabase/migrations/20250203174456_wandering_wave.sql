-- Insert initial version history entries from changelog
INSERT INTO version_history (version, released_at, released_by, changes)
VALUES 
    ('1.2.9', '2025-02-03'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.8', '2025-01-30'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.7', '2025-01-30'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.6', '2025-01-30'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.5', '2025-01-30'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.4', '2025-01-30'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Version bump'),
    ('1.2.0', '2024-01-04'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Improved file upload UX with preview and two-step process. Simplified SKU generation with ID and acronym fields. Split upload form components for better maintainability. Made storage bucket private for enhanced security. Added file upload utilities and SKU generator.'),
    ('1.1.0', '2024-01-04'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Improved dashboard layout with new sidebar navigation. Enhanced user interface with better component organization. Extracted layout components for better maintainability.'),
    ('1.0.0', '2024-01-04'::timestamptz, (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'), 'Initial release of Print Files Manager. Authentication system with email/password login. Dashboard layout with sidebar navigation. File management structure. Database schema with user roles, files table, and RLS policies.');