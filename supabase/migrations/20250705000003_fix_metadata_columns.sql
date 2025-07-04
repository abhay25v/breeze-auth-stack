-- Check if metadata column exists, and if not, add it to both tables

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if metadata exists in otp_attempts
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_attempts'
        AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Add metadata column to otp_attempts
        EXECUTE 'ALTER TABLE public.otp_attempts ADD COLUMN metadata JSONB DEFAULT ''{}'';';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_otp_attempts_metadata ON public.otp_attempts USING GIN (metadata);';
    END IF;
    
    -- Check if metadata exists in user_analytics
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_analytics'
        AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Add metadata column to user_analytics
        EXECUTE 'ALTER TABLE public.user_analytics ADD COLUMN metadata JSONB DEFAULT ''{}'';';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_analytics_metadata ON public.user_analytics USING GIN (metadata);';
    END IF;
END $$;

-- Add comment to the columns
COMMENT ON COLUMN public.otp_attempts.metadata IS 'Stores additional structured data like e-commerce activity details';
COMMENT ON COLUMN public.user_analytics.metadata IS 'Stores additional structured data like e-commerce activity and product interactions';

-- Create view to combine shop data from both tables for easier querying
CREATE OR REPLACE VIEW public.shop_activity_view AS
SELECT
    'otp_attempts' as source_table,
    session_id,
    created_at,
    (metadata->>'product_views')::jsonb as product_views,
    COALESCE((metadata->>'cart_actions')::int, 0) as cart_actions,
    COALESCE((metadata->>'wishlist_actions')::int, 0) as wishlist_actions,
    COALESCE((metadata->>'category_changes')::int, 0) as category_changes,
    COALESCE((metadata->>'searches')::int, 0) as searches
FROM
    public.otp_attempts
WHERE
    otp_code LIKE 'SHOP_ACTIVITY_%' AND metadata IS NOT NULL
UNION ALL
SELECT
    'user_analytics' as source_table,
    session_id,
    created_at,
    (metadata->'shop_metrics'->>'product_views')::jsonb as product_views,
    COALESCE((metadata->'shop_metrics'->>'cart_actions')::int, 0) as cart_actions,
    COALESCE((metadata->'shop_metrics'->>'wishlist_actions')::int, 0) as wishlist_actions,
    COALESCE((metadata->'shop_metrics'->>'category_changes')::int, 0) as category_changes,
    COALESCE((metadata->'shop_metrics'->>'searches')::int, 0) as searches
FROM
    public.user_analytics
WHERE
    metadata->'shop_metrics' IS NOT NULL;
