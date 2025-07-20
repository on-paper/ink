import { useCallback, useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver";
import { useVideoState } from "./useVideoState";

interface UseVideoAutoplayOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
  debounceMs?: number;
}

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function useVideoAutoplay(
  videoId: string,
  options: UseVideoAutoplayOptions = {}
) {
  const {
    enabled = true,
    threshold = 0.5,
    rootMargin = "-10% 0px",
    debounceMs = 150,
  } = options;

  const [respectsReducedMotion] = useState(() => prefersReducedMotion());
  const effectiveEnabled = enabled && !respectsReducedMotion;

  const { registerPlayer, pauseAllOtherVideos } = useVideoState(videoId);
  const { ref, isIntersecting, intersectionRatio } = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  const playCallbackRef = useRef<(() => void) | null>(null);
  const pauseCallbackRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isAutoplaying = useRef(false);

  const registerAutoplayCallbacks = useCallback(
    (playCallback: () => void, pauseCallback: () => void) => {
      playCallbackRef.current = playCallback;
      pauseCallbackRef.current = pauseCallback;
      
      registerPlayer(() => {
        pauseCallback();
        isAutoplaying.current = false;
      });
    },
    [registerPlayer]
  );

  useEffect(() => {
    if (!effectiveEnabled || !playCallbackRef.current || !pauseCallbackRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const shouldPlay = isIntersecting && intersectionRatio >= threshold;
    
    if (shouldPlay && !isAutoplaying.current) {
      pauseAllOtherVideos();
      timeoutRef.current = setTimeout(() => {
        if (isIntersecting && intersectionRatio >= threshold) {
          playCallbackRef.current?.();
          isAutoplaying.current = true;
        }
      }, debounceMs);
    } else if (!shouldPlay && isAutoplaying.current) {
      pauseCallbackRef.current?.();
      isAutoplaying.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isIntersecting, intersectionRatio, threshold, effectiveEnabled, debounceMs, pauseAllOtherVideos]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    isAutoplaying: isAutoplaying.current,
    registerAutoplayCallbacks,
  };
}