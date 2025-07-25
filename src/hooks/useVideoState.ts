import { useEffect, useRef } from "react";
import { createVideoStateDebugger } from "../utils/videoDebug";

// Global state - now with proper cleanup
const activeVideoPlayers = new Set<string>();
const pauseCallbacks = new Map<string, () => void>();
const unmutedVideos = new Set<string>();
const muteCallbacks = new Map<string, () => void>();

const debugLog = createVideoStateDebugger();

// Cleanup function for when all videos are unmounted
const cleanupGlobalVideoState = () => {
  if (pauseCallbacks.size === 0) {
    activeVideoPlayers.clear();
    unmutedVideos.clear();
    muteCallbacks.clear();
    debugLog("Cleaned up global video state");
  }
};

const logGlobalState = () => {
  debugLog("Global State:", {
    activeVideoPlayers: Array.from(activeVideoPlayers),
    pauseCallbacks: Array.from(pauseCallbacks.keys()),
    unmutedVideos: Array.from(unmutedVideos),
    muteCallbacks: Array.from(muteCallbacks.keys()),
  });
};

export const useVideoState = (videoId: string) => {
  const pauseCallbackRef = useRef<() => void>();
  const muteCallbackRef = useRef<() => void>();

  debugLog(`Hook initialized for video: ${videoId}`);

  const registerPlayer = (pauseCallback: () => void, muteCallback?: () => void) => {
    debugLog(`Registering player: ${videoId}`, { hasMuteCallback: !!muteCallback });

    pauseCallbackRef.current = pauseCallback;
    pauseCallbacks.set(videoId, pauseCallback);
    if (muteCallback) {
      muteCallbackRef.current = muteCallback;
      muteCallbacks.set(videoId, muteCallback);
    }

    logGlobalState();
  };

  const unregisterPlayer = () => {
    debugLog(`Unregistering player: ${videoId}`);

    pauseCallbacks.delete(videoId);
    muteCallbacks.delete(videoId);
    activeVideoPlayers.delete(videoId);
    unmutedVideos.delete(videoId);

    // Cleanup global state if no players left
    cleanupGlobalVideoState();

    logGlobalState();
  };

  const pauseAllOtherVideos = () => {
    debugLog(`Pausing all other videos for: ${videoId}`);

    const videosToPause: string[] = [];
    const videosKeptPlaying: string[] = [];

    for (const [playerId, callback] of pauseCallbacks) {
      if (playerId !== videoId) {
        if (!unmutedVideos.has(playerId)) {
          try {
            callback();
            videosToPause.push(playerId);
            // Remove from active players when paused
            activeVideoPlayers.delete(playerId);
          } catch (error) {
            debugLog(`Error pausing video ${playerId}:`, error);
          }
        } else {
          videosKeptPlaying.push(playerId);
          // Keep unmuted videos in active players
          activeVideoPlayers.add(playerId);
        }
      }
    }

    debugLog(`Videos paused: ${videosToPause.length}, kept playing: ${videosKeptPlaying.length}`, {
      paused: videosToPause,
      keptPlaying: videosKeptPlaying,
    });

    // Add the requesting video to active players (will be playing soon)
    activeVideoPlayers.add(videoId);

    logGlobalState();
  };

  const setUnmutedState = (isUnmuted: boolean) => {
    debugLog(`Setting unmuted state for ${videoId}:`, { isUnmuted });

    try {
      if (isUnmuted) {
        const mutedVideos: string[] = [];
        const errors: string[] = [];

        for (const [playerId, muteCallback] of muteCallbacks) {
          if (playerId !== videoId && unmutedVideos.has(playerId)) {
            try {
              muteCallback();
              unmutedVideos.delete(playerId);
              mutedVideos.push(playerId);
            } catch (error) {
              debugLog(`Error muting video ${playerId}:`, error);
              errors.push(playerId);
            }
          }
        }

        debugLog(`Muted other videos: ${mutedVideos.length}, errors: ${errors.length}`, {
          mutedVideos,
          errors,
        });
        unmutedVideos.add(videoId);
      } else {
        unmutedVideos.delete(videoId);
      }
    } catch (error) {
      debugLog(`Error in setUnmutedState for ${videoId}:`, error);
    }

    logGlobalState();
  };

  useEffect(() => {
    return () => {
      unregisterPlayer();
    };
  }, [videoId]);

  return {
    registerPlayer,
    unregisterPlayer,
    pauseAllOtherVideos,
    setUnmutedState,
  };
};
