-- Add metadata JSONB column to user_analytics table to store additional e-commerce analytics
ALTER TABLE public.user_analytics ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance on JSON data
CREATE INDEX idx_user_analytics_metadata ON public.user_analytics USING GIN (metadata);

COMMENT ON COLUMN public.user_analytics.metadata IS 'Stores additional structured data like e-commerce activity and product interactions';
