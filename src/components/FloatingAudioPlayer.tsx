"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  audioCurrentTimeAtom,
  audioDisplayTimeAtom,
  audioDurationAtom,
  audioPlayingAtom,
  audioProgressPercentageAtom,
  audioVolumeAtom,
  currentAudioAtom,
  globalAudioElementAtom,
  miniPlayerVisibleAtom,
  pauseAudioAtom,
  playAudioAtom,
  seekAudioAtom,
  stopAudioAtom,
  toggleTimeDisplayAtom,
  visibleAudioPlayerUrlAtom,
} from "../atoms/audio";

export const FloatingAudioPlayer = () => {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentAudio = useAtomValue(currentAudioAtom);
  const isPlaying = useAtomValue(audioPlayingAtom);
  const progressPercentage = useAtomValue(audioProgressPercentageAtom);
  const displayTime = useAtomValue(audioDisplayTimeAtom);
  const isVisible = useAtomValue(miniPlayerVisibleAtom);
  const volume = useAtomValue(audioVolumeAtom);
  const visibleAudioPlayerUrl = useAtomValue(visibleAudioPlayerUrlAtom);

  const pauseAudio = useSetAtom(pauseAudioAtom);
  const playAudio = useSetAtom(playAudioAtom);
  const stopAudio = useSetAtom(stopAudioAtom);
  const seekAudio = useSetAtom(seekAudioAtom);
  const toggleTimeDisplay = useSetAtom(toggleTimeDisplayAtom);

  const setGlobalAudioElement = useSetAtom(globalAudioElementAtom);
  const [currentTime, setCurrentTime] = useAtom(audioCurrentTimeAtom);
  const [duration, setDuration] = useAtom(audioDurationAtom);

  useEffect(() => {
    if (audioRef.current) {
      setGlobalAudioElement(audioRef.current);

      const audio = audioRef.current;
      audio.volume = volume;
      audio.loop = true;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        stopAudio();
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => {
          if (currentAudio) {
            playAudio(currentAudio);
          }
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          pauseAudio();
        });

        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
          const skipTime = details.seekOffset || 10;
          const newTime = Math.max(audio.currentTime - skipTime, 0);
          seekAudio(newTime);
        });

        navigator.mediaSession.setActionHandler("seekforward", (details) => {
          const skipTime = details.seekOffset || 10;
          const newTime = Math.min(audio.currentTime + skipTime, audio.duration);
          seekAudio(newTime);
        });

        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined) {
            seekAudio(details.seekTime);
          }
        });
      }

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  useEffect(() => {
    if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
      if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: currentTime,
        });
      }
    }
  }, [currentTime, duration]);

  const handlePlayPause = () => {
    if (!currentAudio) return;

    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(currentAudio);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    seekAudio(newTime);
  };

  const handleGoToPost = () => {
    if (currentAudio?.postId) {
      router.push(`/p/${currentAudio.postId}`);
    }
  };

  const handleClose = () => {
    stopAudio();
  };

  return (
    <>
      <audio ref={audioRef} />
      <AnimatePresence>
        {isVisible && currentAudio && visibleAudioPlayerUrl !== currentAudio.url && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 md:right-auto md:w-96 z-30 bg-gradient-to-r from-white/10 dark:from-zinc-800/50 overflow-hidden to-zinc-200/20 dark:to-zinc-900/50 backdrop-blur-md rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-700"
          >
            <div
              className="w-full h-1 bg-black/20 dark:bg-white/20 rounded-t-lg overflow-hidden cursor-pointer active:opacity-85"
              onClick={handleProgressClick}
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <button
              onClick={handleClose}
              className="absolute top-1.5 right-1 w-5 h-5 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all z-10 hover:scale-125 active:scale-95 active:opacity-85"
            >
              <XIcon size={12} className="text-white" />
            </button>

            <div className="p-3 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleGoToPost}
              >
                <img src={currentAudio.cover} alt={currentAudio.title} className="w-full h-full object-cover" />
              </div>

              <button
                onClick={handlePlayPause}
                className="w-9 h-9 rounded-full active:scale-95 hover:scale-105 transition-all duration-150 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center active:opacity-85"
              >
                {isPlaying ? (
                  <PauseIcon size={17} className="dark:text-white text-black" />
                ) : (
                  <PlayIcon size={17} className="dark:text-white text-black ml-0.5" />
                )}
              </button>

              <div
                className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleGoToPost}
              >
                <div className="dark:text-white text-black font-semibold text-sm truncate">{currentAudio.title}</div>
                <div className="dark:text-zinc-400 text-zinc-600 text-xs truncate">{currentAudio.artist}</div>
              </div>

              <button
                onClick={toggleTimeDisplay}
                className="dark:text-white text-black text-xs font-mono hover:text-gray-300 transition-colors cursor-pointer select-none min-w-8 text-center active:opacity-85"
              >
                {displayTime}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
