CREATE OR REPLACE FUNCTION public.check_metadata_columns()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Check the column definitions in both tables
    SELECT json_build_object(
        'otp_attempts_metadata', (
            SELECT json_build_object(
                'exists', count(*) > 0,
                'type', data_type
            )
            FROM information_schema.columns
            WHERE table_name = 'otp_attempts' AND column_name = 'metadata'
        ),
        'user_analytics_metadata', (
            SELECT json_build_object(
                'exists', count(*) > 0,
                'type', data_type
            )
            FROM information_schema.columns
            WHERE table_name = 'user_analytics' AND column_name = 'metadata'
        ),
        'sample_data', (
            SELECT json_build_object(
                'otp_sample', (SELECT metadata FROM otp_attempts WHERE metadata IS NOT NULL LIMIT 1),
                'analytics_sample', (SELECT metadata FROM user_analytics WHERE metadata IS NOT NULL LIMIT 1)
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
