-- First, check if the metadata columns exist on both tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  (table_name = 'otp_attempts' OR table_name = 'user_analytics')
  AND column_name = 'metadata';

-- Check if we have any data at all in the tables
SELECT COUNT(*) AS total_otp_attempts FROM public.otp_attempts;
SELECT COUNT(*) AS total_analytics FROM public.user_analytics;

-- If metadata column is missing, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'otp_attempts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.otp_attempts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added metadata column to otp_attempts';
  ELSE
    RAISE NOTICE 'metadata column already exists in otp_attempts';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_analytics' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.user_analytics ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added metadata column to user_analytics';
  ELSE
    RAISE NOTICE 'metadata column already exists in user_analytics';
  END IF;
END $$;

-- Insert test data to verify the tables work
INSERT INTO public.otp_attempts (
  session_id,
  risk_score,
  otp_code,
  is_valid,
  metadata
) VALUES (
  'test_session_' || floor(random() * 1000)::text,
  20,
  'SHOP_ACTIVITY_TEST',
  true,
  '{"product_views": [1, 2, 3], "cart_actions": 2, "wishlist_actions": 1, "category_changes": 1, "searches": 0}'::jsonb
)
RETURNING id, session_id, otp_code, metadata;

INSERT INTO public.user_analytics (
  session_id,
  page_url,
  user_agent,
  typing_wpm,
  typing_keystrokes,
  typing_pauses,
  typing_corrections,
  mouse_clicks,
  mouse_movements,
  mouse_velocity,
  mouse_idle_time,
  scroll_depth,
  scroll_speed,
  scroll_events,
  focus_changes,
  focus_time,
  tab_switches,
  interactions_count,
  metadata
) VALUES (
  'test_session_' || floor(random() * 1000)::text,
  'https://example.com/test',
  'Test User Agent',
  50,
  120,
  5,
  10,
  25,
  1000,
  20,
  60000,
  75,
  30,
  15,
  4,
  300000,
  2,
  150,
  '{"shop_metrics": {"product_views": [4, 5, 6], "cart_actions": 3, "wishlist_actions": 2, "category_changes": 2, "searches": 1}}'::jsonb
)
RETURNING id, session_id, metadata;

-- Check if we now have data with metadata
SELECT COUNT(*) AS otp_with_metadata 
FROM public.otp_attempts 
WHERE metadata IS NOT NULL;

SELECT COUNT(*) AS analytics_with_metadata 
FROM public.user_analytics 
WHERE metadata IS NOT NULL;
