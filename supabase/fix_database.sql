-- First create the RPC function needed for diagnostics
CREATE OR REPLACE FUNCTION get_table_columns(table_names text[])
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT json_agg(cols)
        FROM (
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM 
                information_schema.columns
            WHERE 
                table_name = ANY(table_names)
            ORDER BY 
                table_name, ordinal_position
        ) cols
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop metadata columns if they exist with wrong type
DO $$ 
BEGIN
    -- Check if the otp_attempts metadata column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_attempts' AND column_name = 'metadata'
    ) THEN
        -- Check if it's not JSONB
        IF (
            SELECT data_type 
            FROM information_schema.columns
            WHERE table_name = 'otp_attempts' AND column_name = 'metadata'
        ) != 'jsonb' THEN
            -- Drop and recreate with correct type
            ALTER TABLE public.otp_attempts DROP COLUMN metadata;
            ALTER TABLE public.otp_attempts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Fixed otp_attempts metadata column type';
        ELSE
            RAISE NOTICE 'otp_attempts metadata column already has correct type';
        END IF;
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE public.otp_attempts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to otp_attempts';
    END IF;
    
    -- Check if the user_analytics metadata column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_analytics' AND column_name = 'metadata'
    ) THEN
        -- Check if it's not JSONB
        IF (
            SELECT data_type 
            FROM information_schema.columns
            WHERE table_name = 'user_analytics' AND column_name = 'metadata'
        ) != 'jsonb' THEN
            -- Drop and recreate with correct type
            ALTER TABLE public.user_analytics DROP COLUMN metadata;
            ALTER TABLE public.user_analytics ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Fixed user_analytics metadata column type';
        ELSE
            RAISE NOTICE 'user_analytics metadata column already has correct type';
        END IF;
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE public.user_analytics ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to user_analytics';
    END IF;
END $$;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_otp_attempts_metadata ON public.otp_attempts USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_user_analytics_metadata ON public.user_analytics USING GIN (metadata);

-- Insert test data to verify functionality
INSERT INTO public.otp_attempts (
  session_id,
  risk_score,
  otp_code,
  is_valid,
  metadata
) VALUES (
  'test_session_' || floor(random() * 10000)::text,
  15,
  'TEST_DIAGNOSTIC_ENTRY',
  true,
  '{"test": true, "product_views": [1,2,3], "cart_actions": 1, "wishlist_actions": 2, "category_changes": 1, "searches": 3}'::jsonb
)
RETURNING id, session_id, otp_code, risk_score, metadata;
