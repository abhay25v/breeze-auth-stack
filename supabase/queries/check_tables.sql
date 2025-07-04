-- This query checks if metadata column exists in both tables
SELECT 
  column_name,
  data_type
FROM 
  information_schema.columns
WHERE 
  table_name = 'otp_attempts'
  OR table_name = 'user_analytics'
ORDER BY 
  table_name, ordinal_position;

-- Sample query to check entries in otp_attempts table
SELECT 
  id, 
  session_id, 
  otp_code, 
  created_at,
  metadata
FROM 
  public.otp_attempts
WHERE 
  otp_code LIKE 'SHOP_%'
ORDER BY 
  created_at DESC
LIMIT 10;

-- Sample query to check entries in user_analytics table with shop metadata
SELECT 
  id,
  session_id,
  created_at,
  metadata->'shop_metrics' as shop_metrics
FROM 
  public.user_analytics
WHERE 
  metadata->'shop_metrics' IS NOT NULL
ORDER BY 
  created_at DESC
LIMIT 10;

-- Create view to combine shop data from both tables
CREATE OR REPLACE VIEW public.combined_shop_analytics AS
SELECT
  'otp_attempts' as source_table,
  session_id,
  created_at,
  metadata->'product_views' as product_views,
  (metadata->>'cart_actions')::int as cart_actions,
  (metadata->>'wishlist_actions')::int as wishlist_actions,
  (metadata->>'category_changes')::int as category_changes,
  (metadata->>'searches')::int as searches
FROM
  public.otp_attempts
WHERE
  otp_code LIKE 'SHOP_ACTIVITY_%' AND metadata IS NOT NULL
UNION ALL
SELECT
  'user_analytics' as source_table,
  session_id,
  created_at,
  metadata->'shop_metrics'->'product_views' as product_views,
  (metadata->'shop_metrics'->>'cart_actions')::int as cart_actions,
  (metadata->'shop_metrics'->>'wishlist_actions')::int as wishlist_actions,
  (metadata->'shop_metrics'->>'category_changes')::int as category_changes,
  (metadata->'shop_metrics'->>'searches')::int as searches
FROM
  public.user_analytics
WHERE
  metadata->'shop_metrics' IS NOT NULL;
