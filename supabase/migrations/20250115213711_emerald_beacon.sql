-- Create function to create database backup
CREATE OR REPLACE FUNCTION create_database_backup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backup_data json;
    filename text;
BEGIN
    -- Verify user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create backups';
    END IF;

    -- Generate timestamp for filename
    filename := 'database_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS') || '.json';

    -- Collect data from all relevant tables
    WITH backup AS (
        SELECT json_build_object(
            'design_files', (SELECT json_agg(row_to_json(t)) FROM design_files t),
            'categories', (SELECT json_agg(row_to_json(t)) FROM categories t),
            'keywords', (SELECT json_agg(row_to_json(t)) FROM keywords t),
            'design_categories', (SELECT json_agg(row_to_json(t)) FROM design_categories t),
            'design_keyword_links', (SELECT json_agg(row_to_json(t)) FROM design_keyword_links t),
            'design_mockups', (SELECT json_agg(row_to_json(t)) FROM design_mockups t),
            'metadata', json_build_object(
                'timestamp', now(),
                'version', '1.2.3',
                'user', auth.uid()
            )
        ) as data
    )
    SELECT data INTO backup_data FROM backup;

    -- Return the backup data and filename
    RETURN json_build_object(
        'filename', filename,
        'data', backup_data
    );
END;
$$;

-- Create function to create storage backup
CREATE OR REPLACE FUNCTION create_storage_backup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backup_data json;
    filename text;
BEGIN
    -- Verify user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create backups';
    END IF;

    -- Generate timestamp for filename
    filename := 'storage_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS') || '.json';

    -- Collect storage data
    WITH storage_data AS (
        SELECT json_build_object(
            'objects', (
                SELECT json_agg(json_build_object(
                    'name', name,
                    'bucket_id', bucket_id,
                    'owner', owner,
                    'created_at', created_at,
                    'updated_at', updated_at,
                    'metadata', metadata
                ))
                FROM storage.objects
                WHERE bucket_id = 'designs'
            ),
            'metadata', json_build_object(
                'timestamp', now(),
                'version', '1.2.3',
                'user', auth.uid()
            )
        ) as data
    )
    SELECT data INTO backup_data FROM storage_data;

    -- Return the backup data and filename
    RETURN json_build_object(
        'filename', filename,
        'data', backup_data
    );
END;
$$;