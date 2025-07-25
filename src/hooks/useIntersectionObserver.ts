import { useEffect, useRef, useState } from "react";
import { createVideoDebugger } from "../utils/videoDebug";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

let observerIdCounter = 0;
const debugLog = createVideoDebugger('intersection');

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerIdRef = useRef(++observerIdCounter);

  debugLog(observerIdRef.current, 'Hook initialized', options);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      debugLog(observerIdRef.current, 'No element to observe');
      return;
    }

    const defaultOptions = {
      threshold: 0.5,
      rootMargin: "0px",
      root: document.querySelector("[data-overlayscrollbars-viewport]"),
      ...options,
    };

    debugLog(observerIdRef.current, 'Creating observer', {
      element: element.tagName,
      elementId: element.id || 'no-id',
      options: defaultOptions,
      scrollContainer: !!defaultOptions.root
    });

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          debugLog(observerIdRef.current, 'Intersection change', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: {
              top: Math.round(entry.boundingClientRect.top),
              bottom: Math.round(entry.boundingClientRect.bottom),
              height: Math.round(entry.boundingClientRect.height)
            },
            rootBounds: entry.rootBounds ? {
              top: Math.round(entry.rootBounds.top),
              bottom: Math.round(entry.rootBounds.bottom),
              height: Math.round(entry.rootBounds.height)
            } : null
          });
          
          setIsIntersecting(entry.isIntersecting);
          setIntersectionRatio(entry.intersectionRatio);
        }
      },
      defaultOptions
    );

    observerRef.current.observe(element);

    return () => {
      debugLog(observerIdRef.current, 'Disconnecting observer');
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options.threshold, options.rootMargin, options.root]);

  return {
    ref: elementRef,
    isIntersecting,
    intersectionRatio,
  };
}