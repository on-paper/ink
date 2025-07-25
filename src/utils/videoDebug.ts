// Central debug configuration for video autoplay system
// Set to false to disable all video debugging logs

export const VIDEO_DEBUG_CONFIG = {
  autoplay: true,
  videoState: true,
  intersection: true,
  viewport: true,
} as const;

// Easy toggle to disable all debugging
export const DISABLE_ALL_VIDEO_DEBUG = process.env.NODE_ENV === "production";

export const createVideoDebugger = (component: keyof typeof VIDEO_DEBUG_CONFIG) => {
  return (id: string | number, message: string, data?: any) => {
    if (!DISABLE_ALL_VIDEO_DEBUG && VIDEO_DEBUG_CONFIG[component]) {
      const prefix =
        component === "autoplay"
          ? "VideoAutoplay"
          : component === "videoState"
            ? "VideoState"
            : component === "viewport"
              ? "VideoViewport"
              : "IntersectionObserver";
      console.log(`[${prefix}:${id}] ${message}`, data || "");
    }
  };
};

// Helper for video state (no ID needed)
export const createVideoStateDebugger = () => {
  return (message: string, data?: any) => {
    if (!DISABLE_ALL_VIDEO_DEBUG && VIDEO_DEBUG_CONFIG.videoState) {
      console.log(`[VideoState] ${message}`, data || "");
    }
  };
};
