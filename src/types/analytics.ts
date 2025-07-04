// Define shared types for analytics data

export interface TypingMetrics {
  keystrokes: number;
  wpm: number;
  backspaces: number;
  accuracy: number;
}

export interface MouseMetrics {
  clicks: number;
  totalDistance: number;
  averageSpeed: number;
  idleTime: number;
}

export interface ScrollMetrics {
  maxDepth: number;
  totalScrollDistance: number;
  scrollSpeed: number;
}

export interface FocusMetrics {
  focusEvents: number;
  blurEvents: number;
  tabSwitches: number;
  totalFocusTime: number;
}

export interface ShopMetrics {
  product_views: number[];
  cart_actions: number;
  wishlist_actions: number;
  category_changes: number;
  searches: number;
}

export interface UserAnalytics {
  id: string;
  user_id: string | null;
  session_id: string;
  page_url: string | null;
  user_agent: string | null;
  typing_wpm: number;
  typing_keystrokes: number;
  typing_pauses: number;
  typing_corrections: number;
  mouse_clicks: number;
  mouse_movements: number;
  mouse_velocity: number;
  mouse_idle_time: number;
  scroll_depth: number;
  scroll_speed: number;
  scroll_events: number;
  focus_changes: number;
  focus_time: number;
  tab_switches: number;
  session_duration: number;
  page_views: number;
  interactions_count: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    shop_metrics?: ShopMetrics;
    [key: string]: any;
  };
}

export interface LoginAttempt {
  id: string;
  user_id: string | null;
  session_id: string;
  risk_score: number;
  otp_code: string;
  is_valid: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata?: {
    product_views?: number[];
    cart_actions?: number;
    wishlist_actions?: number;
    category_changes?: number;
    searches?: number;
    [key: string]: any;
  };
}

export interface ShopActivity {
  sessionId: string;
  timestamp: string;
  productViews: number[];
  cartActions: number;
  wishlistActions: number;
  categoryChanges: number;
  searches: number;
}
