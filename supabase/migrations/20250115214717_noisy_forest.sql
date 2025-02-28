-- Drop and recreate backup functions with proper URL construction
CREATE OR REPLACE FUNCTION create_database_backup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backup_data json;
    filename text;
    bucket_url text;
BEGIN
    -- Verify user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create backups';
    END IF;

    -- Get bucket URL from settings
    SELECT COALESCE(
        current_setting('app.settings.storage_url', true),
        'https://jdmxztmdlqkqhaqcgysm.supabase.co/storage/v1/object/public'
    ) INTO bucket_url;

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

    -- Store backup in storage
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES ('backups', 'database/' || filename, auth.uid(), jsonb_build_object('type', 'database_backup'));

    -- Return the backup URL and filename
    RETURN json_build_object(
        'url', bucket_url || '/backups/database/' || filename,
        'filename', filename
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
    bucket_url text;
BEGIN
    -- Verify user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create backups';
    END IF;

    -- Get bucket URL from settings
    SELECT COALESCE(
        current_setting('app.settings.storage_url', true),
        'https://jdmxztmdlqkqhaqcgysm.supabase.co/storage/v1/object/public'
    ) INTO bucket_url;

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

    -- Store backup in storage
    INSERT INTO storage.objects (bucket_id, name, owner, metadata, content)
    VALUES ('backups', 'storage/' || filename, auth.uid(), 
            jsonb_build_object('type', 'storage_backup'),
            backup_data::text::bytea);

    -- Return the backup URL and filename
    RETURN json_build_object(
        'url', bucket_url || '/backups/storage/' || filename,
        'filename', filename
    );
END;
$$;