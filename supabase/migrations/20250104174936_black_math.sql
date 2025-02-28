-- Create function to get keywords for a category
CREATE OR REPLACE FUNCTION get_category_keywords(category_id uuid)
RETURNS TABLE (keyword text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT k.keyword
  FROM keywords k
  JOIN category_keyword_links ckl ON k.id = ckl.keyword_id
  WHERE ckl.category_id = $1;
END;
$$;

-- Create function to get next available SKU ID
CREATE OR REPLACE FUNCTION get_next_sku_id()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id integer;
BEGIN
  SELECT COALESCE(
    (
      SELECT (regexp_matches(sku, '^(\d+)-'))[1]::integer + 1
      FROM design_files
      WHERE sku ~ '^\d+-'
      ORDER BY (regexp_matches(sku, '^(\d+)-'))[1]::integer DESC
      LIMIT 1
    ),
    3001
  ) INTO next_id;
  
  RETURN next_id;
END;
$$;