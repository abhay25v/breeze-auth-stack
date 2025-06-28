import { useState, useEffect, useCallback, useRef } from 'react';

export interface TypingMetrics {
  wpm: number;
  cpm: number;
  keystrokes: number;
  backspaces: number;
  totalTime: number;
  accuracy: number;
}

export interface ScrollMetrics {
  maxDepth: number;
  currentDepth: number;
  totalScrollDistance: number;
  scrollSpeed: number;
  timeSpentAtDepths: Record<string, number>;
}

export interface MouseMetrics {
  totalDistance: number;
  clicks: number;
  rightClicks: number;
  hovers: number;
  averageSpeed: number;
  idleTime: number;
}

export interface FocusMetrics {
  totalFocusTime: number;
  focusEvents: number;
  blurEvents: number;
  averageFocusSession: number;
  tabSwitches: number;
}

export interface UserAnalytics {
  sessionId: string;
  timestamp: number;
  typing: TypingMetrics;
  scroll: ScrollMetrics;
  mouse: MouseMetrics;
  focus: FocusMetrics;
  pageUrl: string;
  userAgent: string;
  sessionDuration: number;
}

export interface UseUserAnalyticsOptions {
  trackTyping?: boolean;
  trackScroll?: boolean;
  trackMouse?: boolean;
  trackFocus?: boolean;
  sendInterval?: number; // milliseconds
  onDataReady?: (data: UserAnalytics) => void;
}

const useUserAnalytics = (options: UseUserAnalyticsOptions = {}) => {
  const {
    trackTyping = true,
    trackScroll = true,
    trackMouse = true,
    trackFocus = true,
    sendInterval = 30000, // 30 seconds
    onDataReady
  } = options;

  // Session management
  const sessionId = useRef(crypto.randomUUID());
  const sessionStartTime = useRef(Date.now());

  // Typing metrics
  const [typingMetrics, setTypingMetrics] = useState<TypingMetrics>({
    wpm: 0,
    cpm: 0,
    keystrokes: 0,
    backspaces: 0,
    totalTime: 0,
    accuracy: 100
  });

  // Scroll metrics
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    maxDepth: 0,
    currentDepth: 0,
    totalScrollDistance: 0,
    scrollSpeed: 0,
    timeSpentAtDepths: {}
  });

  // Mouse metrics
  const [mouseMetrics, setMouseMetrics] = useState<MouseMetrics>({
    totalDistance: 0,
    clicks: 0,
    rightClicks: 0,
    hovers: 0,
    averageSpeed: 0,
    idleTime: 0
  });

  // Focus metrics
  const [focusMetrics, setFocusMetrics] = useState<FocusMetrics>({
    totalFocusTime: 0,
    focusEvents: 0,
    blurEvents: 0,
    averageFocusSession: 0,
    tabSwitches: 0
  });

  // Internal state for calculations
  const typingState = useRef({
    startTime: 0,
    lastKeyTime: 0,
    keyTimes: [] as number[],
    totalCharacters: 0,
    correctCharacters: 0
  });

  const scrollState = useRef({
    lastScrollY: 0,
    lastScrollTime: 0,
    depthStartTimes: {} as Record<string, number>
  });

  const mouseState = useRef({
    lastX: 0,
    lastY: 0,
    lastMoveTime: 0,
    speeds: [] as number[],
    lastActivityTime: Date.now()
  });

  const focusState = useRef({
    lastFocusTime: 0,
    focusSessions: [] as number[],
    isWindowFocused: true
  });

  // Typing tracking
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trackTyping) return;

    const now = Date.now();
    
    if (typingState.current.startTime === 0) {
      typingState.current.startTime = now;
    }

    typingState.current.lastKeyTime = now;
    typingState.current.keyTimes.push(now);

    setTypingMetrics(prev => {
      const newKeystrokes = prev.keystrokes + 1;
      const newBackspaces = event.key === 'Backspace' ? prev.backspaces + 1 : prev.backspaces;
      const totalTime = (now - typingState.current.startTime) / 1000 / 60; // minutes
      
      // Calculate WPM (assuming average word length of 5 characters)
      const wpm = totalTime > 0 ? Math.round((newKeystrokes / 5) / totalTime) : 0;
      const cpm = totalTime > 0 ? Math.round(newKeystrokes / totalTime) : 0;

      // Calculate accuracy
      typingState.current.totalCharacters++;
      if (event.key !== 'Backspace') {
        typingState.current.correctCharacters++;
      }
      const accuracy = typingState.current.totalCharacters > 0 
        ? Math.round((typingState.current.correctCharacters / typingState.current.totalCharacters) * 100)
        : 100;

      return {
        wpm,
        cpm,
        keystrokes: newKeystrokes,
        backspaces: newBackspaces,
        totalTime: totalTime * 60, // convert back to seconds
        accuracy
      };
    });
  }, [trackTyping]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    if (!trackScroll) return;

    const now = Date.now();
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentDepth = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0;

    // Calculate scroll speed
    const timeDiff = now - scrollState.current.lastScrollTime;
    const scrollDiff = Math.abs(scrollY - scrollState.current.lastScrollY);
    const speed = timeDiff > 0 ? scrollDiff / timeDiff : 0;

    // Track time spent at different depths
    const depthKey = Math.floor(currentDepth / 10) * 10; // Group by 10% intervals
    const depthStr = `${depthKey}-${depthKey + 10}%`;
    
    if (scrollState.current.depthStartTimes[depthStr]) {
      const timeSpent = now - scrollState.current.depthStartTimes[depthStr];
      setScrollMetrics(prev => ({
        ...prev,
        timeSpentAtDepths: {
          ...prev.timeSpentAtDepths,
          [depthStr]: (prev.timeSpentAtDepths[depthStr] || 0) + timeSpent
        }
      }));
    }
    scrollState.current.depthStartTimes[depthStr] = now;

    setScrollMetrics(prev => ({
      maxDepth: Math.max(prev.maxDepth, currentDepth),
      currentDepth,
      totalScrollDistance: prev.totalScrollDistance + scrollDiff,
      scrollSpeed: speed,
      timeSpentAtDepths: prev.timeSpentAtDepths
    }));

    scrollState.current.lastScrollY = scrollY;
    scrollState.current.lastScrollTime = now;
  }, [trackScroll]);

  // Mouse tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!trackMouse) return;

    const now = Date.now();
    const { clientX, clientY } = event;

    if (mouseState.current.lastX !== 0 && mouseState.current.lastY !== 0) {
      const distance = Math.sqrt(
        Math.pow(clientX - mouseState.current.lastX, 2) + 
        Math.pow(clientY - mouseState.current.lastY, 2)
      );

      const timeDiff = now - mouseState.current.lastMoveTime;
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      mouseState.current.speeds.push(speed);

      // Keep only last 100 speed measurements for average calculation
      if (mouseState.current.speeds.length > 100) {
        mouseState.current.speeds.shift();
      }

      const averageSpeed = mouseState.current.speeds.reduce((a, b) => a + b, 0) / mouseState.current.speeds.length;

      setMouseMetrics(prev => ({
        ...prev,
        totalDistance: prev.totalDistance + distance,
        averageSpeed: Math.round(averageSpeed * 100) / 100
      }));
    }

    mouseState.current.lastX = clientX;
    mouseState.current.lastY = clientY;
    mouseState.current.lastMoveTime = now;
    mouseState.current.lastActivityTime = now;
  }, [trackMouse]);

  const handleMouseClick = useCallback((event: MouseEvent) => {
    if (!trackMouse) return;

    setMouseMetrics(prev => ({
      ...prev,
      clicks: event.button === 0 ? prev.clicks + 1 : prev.clicks,
      rightClicks: event.button === 2 ? prev.rightClicks + 1 : prev.rightClicks
    }));

    mouseState.current.lastActivityTime = Date.now();
  }, [trackMouse]);

  const handleMouseEnter = useCallback(() => {
    if (!trackMouse) return;

    setMouseMetrics(prev => ({
      ...prev,
      hovers: prev.hovers + 1
    }));
  }, [trackMouse]);

  // Focus tracking
  const handleFocus = useCallback(() => {
    if (!trackFocus) return;

    const now = Date.now();
    focusState.current.lastFocusTime = now;

    setFocusMetrics(prev => ({
      ...prev,
      focusEvents: prev.focusEvents + 1
    }));
  }, [trackFocus]);

  const handleBlur = useCallback(() => {
    if (!trackFocus) return;

    const now = Date.now();
    if (focusState.current.lastFocusTime > 0) {
      const sessionDuration = now - focusState.current.lastFocusTime;
      focusState.current.focusSessions.push(sessionDuration);

      const totalFocusTime = focusState.current.focusSessions.reduce((a, b) => a + b, 0);
      const averageFocusSession = totalFocusTime / focusState.current.focusSessions.length;

      setFocusMetrics(prev => ({
        ...prev,
        blurEvents: prev.blurEvents + 1,
        totalFocusTime: totalFocusTime,
        averageFocusSession: Math.round(averageFocusSession)
      }));
    }
  }, [trackFocus]);

  const handleVisibilityChange = useCallback(() => {
    if (!trackFocus) return;

    if (document.hidden) {
      focusState.current.isWindowFocused = false;
      setFocusMetrics(prev => ({
        ...prev,
        tabSwitches: prev.tabSwitches + 1
      }));
    } else {
      focusState.current.isWindowFocused = true;
    }
  }, [trackFocus]);

  // Calculate idle time
  useEffect(() => {
    if (!trackMouse) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - mouseState.current.lastActivityTime;
      
      if (timeSinceLastActivity > 5000) { // 5 seconds of inactivity
        setMouseMetrics(prev => ({
          ...prev,
          idleTime: prev.idleTime + 1000 // Add 1 second to idle time
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trackMouse]);

  // Set up event listeners
  useEffect(() => {
    if (trackTyping) {
      document.addEventListener('keydown', handleKeyDown);
    }
    if (trackScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (trackMouse) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleMouseClick);
      document.addEventListener('mouseenter', handleMouseEnter);
    }
    if (trackFocus) {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (trackTyping) {
        document.removeEventListener('keydown', handleKeyDown);
      }
      if (trackScroll) {
        window.removeEventListener('scroll', handleScroll);
      }
      if (trackMouse) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleMouseClick);
        document.removeEventListener('mouseenter', handleMouseEnter);
      }
      if (trackFocus) {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [
    trackTyping, trackScroll, trackMouse, trackFocus,
    handleKeyDown, handleScroll, handleMouseMove, handleMouseClick, 
    handleMouseEnter, handleFocus, handleBlur, handleVisibilityChange
  ]);

  // Generate analytics data
  const getAnalyticsData = useCallback((): UserAnalytics => {
    return {
      sessionId: sessionId.current,
      timestamp: Date.now(),
      typing: typingMetrics,
      scroll: scrollMetrics,
      mouse: mouseMetrics,
      focus: focusMetrics,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      sessionDuration: Date.now() - sessionStartTime.current
    };
  }, [typingMetrics, scrollMetrics, mouseMetrics, focusMetrics]);

  // Send data periodically
  useEffect(() => {
    if (!onDataReady || sendInterval <= 0) return;

    const interval = setInterval(() => {
      const data = getAnalyticsData();
      onDataReady(data);
    }, sendInterval);

    return () => clearInterval(interval);
  }, [onDataReady, sendInterval, getAnalyticsData]);

  // Manual data retrieval
  const sendAnalytics = useCallback(() => {
    const data = getAnalyticsData();
    if (onDataReady) {
      onDataReady(data);
    }
    return data;
  }, [getAnalyticsData, onDataReady]);

  // Serialize to JSON
  const getAnalyticsJSON = useCallback(() => {
    return JSON.stringify(getAnalyticsData(), null, 2);
  }, [getAnalyticsData]);

  return {
    analytics: {
      typing: typingMetrics,
      scroll: scrollMetrics,
      mouse: mouseMetrics,
      focus: focusMetrics
    },
    sendAnalytics,
    getAnalyticsJSON,
    sessionId: sessionId.current
  };
};

// Export the hook as default to fix Fast Refresh compatibility
export { useUserAnalytics };
