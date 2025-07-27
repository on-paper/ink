import { useEffect, useRef } from "react";

// Global state - now with proper cleanup
const activeVideoPlayers = new Set<string>();
const pauseCallbacks = new Map<string, () => void>();
const unmutedVideos = new Set<string>();
const muteCallbacks = new Map<string, () => void>();


// Cleanup function for when all videos are unmounted
const cleanupGlobalVideoState = () => {
  if (pauseCallbacks.size === 0) {
    activeVideoPlayers.clear();
    unmutedVideos.clear();
    muteCallbacks.clear();
  }
};


export const useVideoState = (videoId: string) => {
  const pauseCallbackRef = useRef<() => void>();
  const muteCallbackRef = useRef<() => void>();


  const registerPlayer = (pauseCallback: () => void, muteCallback?: () => void) => {

    pauseCallbackRef.current = pauseCallback;
    pauseCallbacks.set(videoId, pauseCallback);
    if (muteCallback) {
      muteCallbackRef.current = muteCallback;
      muteCallbacks.set(videoId, muteCallback);
    }

  };

  const unregisterPlayer = () => {

    pauseCallbacks.delete(videoId);
    muteCallbacks.delete(videoId);
    activeVideoPlayers.delete(videoId);
    unmutedVideos.delete(videoId);

    // Cleanup global state if no players left
    cleanupGlobalVideoState();

  };

  const pauseAllOtherVideos = () => {

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
          }
        } else {
          videosKeptPlaying.push(playerId);
          // Keep unmuted videos in active players
          activeVideoPlayers.add(playerId);
        }
      }
    }


    // Add the requesting video to active players (will be playing soon)
    activeVideoPlayers.add(videoId);

  };

  const setUnmutedState = (isUnmuted: boolean) => {

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
              errors.push(playerId);
            }
          }
        }

        unmutedVideos.add(videoId);
      } else {
        unmutedVideos.delete(videoId);
      }
    } catch (error) {
    }

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
