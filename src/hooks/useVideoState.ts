import { useEffect, useRef } from "react";

const activeVideoPlayers = new Set<string>();
const pauseCallbacks = new Map<string, () => void>();
const unmutedVideos = new Set<string>();
const muteCallbacks = new Map<string, () => void>();

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
  };

  const pauseAllOtherVideos = () => {
    for (const [playerId, callback] of pauseCallbacks) {
      if (playerId !== videoId && !unmutedVideos.has(playerId)) {
        callback();
      }
    }
    activeVideoPlayers.clear();
    activeVideoPlayers.add(videoId);
  };
  
  const setUnmutedState = (isUnmuted: boolean) => {
    if (isUnmuted) {
      for (const [playerId, muteCallback] of muteCallbacks) {
        if (playerId !== videoId && unmutedVideos.has(playerId)) {
          muteCallback();
          unmutedVideos.delete(playerId);
        }
      }
      unmutedVideos.add(videoId);
    } else {
      unmutedVideos.delete(videoId);
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
