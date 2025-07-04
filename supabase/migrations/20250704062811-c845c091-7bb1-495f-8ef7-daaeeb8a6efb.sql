-- Create user_analytics table to store detailed behavior tracking
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  
  -- Typing analytics
  typing_wpm INTEGER DEFAULT 0,
  typing_keystrokes INTEGER DEFAULT 0,
  typing_pauses INTEGER DEFAULT 0,
  typing_corrections INTEGER DEFAULT 0,
  
  -- Mouse analytics  
  mouse_clicks INTEGER DEFAULT 0,
  mouse_movements INTEGER DEFAULT 0,
  mouse_velocity DECIMAL DEFAULT 0,
  mouse_idle_time INTEGER DEFAULT 0,
  
  -- Scroll analytics
  scroll_depth INTEGER DEFAULT 0,
  scroll_speed DECIMAL DEFAULT 0,
  scroll_events INTEGER DEFAULT 0,
  
  -- Focus analytics
  focus_changes INTEGER DEFAULT 0,
  focus_time INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  
  -- Session analytics
  session_duration INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  interactions_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for user analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create analytics data" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own analytics" 
ON public.user_analytics 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_analytics_updated_at
BEFORE UPDATE ON public.user_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_user_analytics_updated_at();

-- Create index for better performance
CREATE INDEX idx_user_analytics_session_id ON public.user_analytics(session_id);
CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_created_at ON public.user_analytics(created_at);