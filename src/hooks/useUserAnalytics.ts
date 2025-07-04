import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

export interface UserAnalyticsProps {
  trackTyping?: boolean;
  trackMouse?: boolean;
  trackScroll?: boolean;
  trackFocus?: boolean;
  sendInterval?: number;
  onDataReady?: (data: any) => void;
}

export const useUserAnalytics = ({
  trackTyping = true,
  trackMouse = true,
  trackScroll = true,
  trackFocus = true,
  sendInterval = 10000, // Parameter for interval duration
  onDataReady
}: UserAnalyticsProps) => {
  // Generate session ID if not present in sessionStorage
  const sessionId = useRef(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('analytics_session_id') || uuidv4()
      : uuidv4()
  );

  // Store session ID in sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId.current);
    }
  }, []);

  // Metrics state
  const [typing, setTyping] = useState<TypingMetrics>({
    keystrokes: 0,
    wpm: 0,
    backspaces: 0,
    accuracy: 100,
  });

  const [mouse, setMouse] = useState<MouseMetrics>({
    clicks: 0,
    totalDistance: 0,
    averageSpeed: 0,
    idleTime: 0,
  });

  const [scroll, setScroll] = useState<ScrollMetrics>({
    maxDepth: 0,
    totalScrollDistance: 0,
    scrollSpeed: 0,
  });

  const [focus, setFocus] = useState<FocusMetrics>({
    focusEvents: 0,
    blurEvents: 0,
    tabSwitches: 0,
    totalFocusTime: 0,
  });

  // Custom events for shop activity tracking
  const [customEvents, setCustomEvents] = useState<any[]>([]);

  // Refs for tracking
  const typingRef = useRef({
    startTime: Date.now(),
    keyCount: 0,
    backspaceCount: 0,
    totalChars: 0,
  });

  const mouseRef = useRef({
    prevX: 0,
    prevY: 0,
    distance: 0,
    lastMoveTime: Date.now(),
    speeds: [] as number[],
    idleStart: Date.now(),
  });

  const scrollRef = useRef({
    lastScrollTime: Date.now(),
    lastScrollPosition: 0,
    maxScrollDepth: 0,
    scrollDistances: [] as number[],
  });

  const focusRef = useRef({
    focusStart: Date.now(),
    totalFocusTime: 0,
    lastFocused: true,
  });

  // Calculate typing metrics
  const calculateTypingMetrics = useCallback(() => {
    const now = Date.now();
    const elapsedMinutes = (now - typingRef.current.startTime) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round(typingRef.current.keyCount / 5 / elapsedMinutes) : 0;
    const accuracy = typingRef.current.totalChars > 0
      ? Math.round(((typingRef.current.totalChars - typingRef.current.backspaceCount) / typingRef.current.totalChars) * 100)
      : 100;

    setTyping({
      keystrokes: typingRef.current.keyCount,
      wpm,
      backspaces: typingRef.current.backspaceCount,
      accuracy,
    });
  }, []);

  // Calculate mouse metrics
  const calculateMouseMetrics = useCallback(() => {
    const now = Date.now();
    const idleTime = mouseRef.current.lastMoveTime ? now - mouseRef.current.lastMoveTime : 0;
    const avgSpeed = mouseRef.current.speeds.length > 0
      ? mouseRef.current.speeds.reduce((a, b) => a + b, 0) / mouseRef.current.speeds.length
      : 0;

    setMouse({
      clicks: mouse.clicks,
      totalDistance: mouseRef.current.distance,
      averageSpeed: avgSpeed,
      idleTime: idleTime > 1000 ? idleTime : 0,
    });
  }, [mouse.clicks]);

  // Calculate scroll metrics
  const calculateScrollMetrics = useCallback(() => {
    const avgSpeed = scrollRef.current.scrollDistances.length > 0
      ? scrollRef.current.scrollDistances.reduce((a, b) => a + b, 0) / scrollRef.current.scrollDistances.length
      : 0;

    setScroll({
      maxDepth: scrollRef.current.maxScrollDepth,
      totalScrollDistance: scroll.totalScrollDistance,
      scrollSpeed: avgSpeed,
    });
  }, [scroll.totalScrollDistance]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Typing tracking
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!trackTyping) return;
      
      typingRef.current.keyCount++;
      typingRef.current.totalChars++;
      
      if (e.key === 'Backspace') {
        typingRef.current.backspaceCount++;
      }
      
      calculateTypingMetrics();
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!trackMouse) return;
      
      const { clientX, clientY } = e;
      if (mouseRef.current.prevX && mouseRef.current.prevY) {
        const dx = clientX - mouseRef.current.prevX;
        const dy = clientY - mouseRef.current.prevY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only count significant movements
        if (distance > 5) {
          mouseRef.current.distance += distance;
          
          const now = Date.now();
          const timeDiff = now - mouseRef.current.lastMoveTime;
          if (timeDiff > 0) {
            const speed = distance / timeDiff * 1000; // pixels per second
            mouseRef.current.speeds.push(speed);
            // Keep only last 100 speed measurements
            if (mouseRef.current.speeds.length > 100) {
              mouseRef.current.speeds.shift();
            }
          }
          
          mouseRef.current.lastMoveTime = now;
        }
      }
      
      mouseRef.current.prevX = clientX;
      mouseRef.current.prevY = clientY;
      
      calculateMouseMetrics();
    };

    const handleMouseClick = () => {
      if (!trackMouse) return;
      setMouse(prev => ({ ...prev, clicks: prev.clicks + 1 }));
    };

    // Scroll tracking
    const handleScroll = () => {
      if (!trackScroll) return;
      
      const scrollY = window.scrollY;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const viewportHeight = window.innerHeight;
      const scrollPercent = (scrollY / (docHeight - viewportHeight)) * 100;
      
      // Track max scroll depth
      if (scrollPercent > scrollRef.current.maxScrollDepth) {
        scrollRef.current.maxScrollDepth = scrollPercent;
      }
      
      // Calculate scroll distance
      const scrollDistance = Math.abs(scrollY - scrollRef.current.lastScrollPosition);
      scrollRef.current.lastScrollPosition = scrollY;
      
      // Update total scroll distance
      setScroll(prev => ({
        ...prev,
        totalScrollDistance: prev.totalScrollDistance + scrollDistance
      }));
      
      // Track scroll speed
      const now = Date.now();
      const timeDiff = now - scrollRef.current.lastScrollTime;
      if (timeDiff > 0 && scrollDistance > 0) {
        const speed = scrollDistance / timeDiff * 1000; // pixels per second
        scrollRef.current.scrollDistances.push(speed);
        // Keep only last 100 speed measurements
        if (scrollRef.current.scrollDistances.length > 100) {
          scrollRef.current.scrollDistances.shift();
        }
      }
      scrollRef.current.lastScrollTime = now;
      
      calculateScrollMetrics();
    };

    // Focus tracking
    const handleVisibilityChange = () => {
      if (!trackFocus) return;
      
      const isVisible = !document.hidden;
      const now = Date.now();
      
      if (isVisible && !focusRef.current.lastFocused) {
        // Tab became visible (focus)
        setFocus(prev => ({
          ...prev,
          focusEvents: prev.focusEvents + 1,
          tabSwitches: prev.tabSwitches + 1
        }));
        focusRef.current.focusStart = now;
      } else if (!isVisible && focusRef.current.lastFocused) {
        // Tab became hidden (blur)
        setFocus(prev => ({
          ...prev,
          blurEvents: prev.blurEvents + 1,
          tabSwitches: prev.tabSwitches + 1
        }));
        
        // Add focus time
        const focusDuration = now - focusRef.current.focusStart;
        focusRef.current.totalFocusTime += focusDuration;
        setFocus(prev => ({
          ...prev,
          totalFocusTime: focusRef.current.totalFocusTime
        }));
      }
      
      focusRef.current.lastFocused = isVisible;
    };

    const handleFocus = () => {
      if (!trackFocus) return;
      setFocus(prev => ({ ...prev, focusEvents: prev.focusEvents + 1 }));
      focusRef.current.focusStart = Date.now();
    };

    const handleBlur = () => {
      if (!trackFocus) return;
      setFocus(prev => ({ ...prev, blurEvents: prev.blurEvents + 1 }));
      
      // Add focus time
      const now = Date.now();
      const focusDuration = now - focusRef.current.focusStart;
      focusRef.current.totalFocusTime += focusDuration;
      
      setFocus(prev => ({
        ...prev,
        totalFocusTime: focusRef.current.totalFocusTime
      }));
    };

    // Register event listeners
    if (trackTyping) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    if (trackMouse) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleMouseClick);
    }
    
    if (trackScroll) {
      window.addEventListener('scroll', handleScroll);
    }
    
    if (trackFocus) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
    }

    // Send analytics data at intervals - rename variable to avoid conflict with parameter
    const analyticsIntervalId = setInterval(() => {
      const data = {
        sessionId: sessionId.current,
        typing,
        mouse,
        scroll,
        focus,
        customEvents,
        timestamp: new Date().toISOString(),
      };
      
      onDataReady?.(data);
    }, sendInterval);  // Use the parameter here

    // Cleanup
    return () => {
      if (trackTyping) {
        window.removeEventListener('keydown', handleKeyDown);
      }
      
      if (trackMouse) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleMouseClick);
      }
      
      if (trackScroll) {
        window.removeEventListener('scroll', handleScroll);
      }
      
      if (trackFocus) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      }
      
      clearInterval(analyticsIntervalId);  // Clear the renamed interval
    };
  }, [
    trackTyping,
    trackMouse,
    trackScroll,
    trackFocus,
    sendInterval,
    onDataReady,
    calculateTypingMetrics,
    calculateMouseMetrics,
    calculateScrollMetrics,
    typing,
    mouse,
    scroll,
    focus,
    customEvents,
  ]);

  const sendAnalytics = useCallback(() => {
    const data = {
      sessionId: sessionId.current,
      typing,
      mouse,
      scroll,
      focus,
      customEvents,
      timestamp: new Date().toISOString(),
    };
    
    onDataReady?.(data);
    return data;
  }, [typing, mouse, scroll, focus, customEvents, onDataReady]);

  return {
    analytics: { typing, mouse, scroll, focus },
    sendAnalytics,
    sessionId: sessionId.current,
  };
};

export default useUserAnalytics;
