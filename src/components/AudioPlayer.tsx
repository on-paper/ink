"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type AudioMetadata,
  audioDisplayTimeAtom,
  audioDurationAtom,
  audioPlayingAtom,
  audioProgressPercentageAtom,
  currentAudioAtom,
  hideMiniPlayerAtom,
  pauseAudioAtom,
  playAudioAtom,
  seekAudioAtom,
  showMiniPlayerAtom,
  toggleTimeDisplayAtom,
  visibleAudioPlayerUrlAtom,
} from "../atoms/audio";

export const AudioPlayer = ({
  url,
  cover,
  author,
  title,
  postId,
}: {
  url: string;
  cover: string;
  author: string;
  title: string;
  postId?: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const audioPlayerRef = useRef<HTMLDivElement>(null);

  const currentAudio = useAtomValue(currentAudioAtom);
  const isPlaying = useAtomValue(audioPlayingAtom);
  const progressPercentage = useAtomValue(audioProgressPercentageAtom);
  const displayTime = useAtomValue(audioDisplayTimeAtom);
  const duration = useAtomValue(audioDurationAtom);

  const playAudio = useSetAtom(playAudioAtom);
  const pauseAudio = useSetAtom(pauseAudioAtom);
  const seekAudio = useSetAtom(seekAudioAtom);
  const toggleTimeDisplay = useSetAtom(toggleTimeDisplayAtom);
  const hideMiniPlayer = useSetAtom(hideMiniPlayerAtom);
  const showMiniPlayer = useSetAtom(showMiniPlayerAtom);
  const setVisibleAudioPlayerUrl = useSetAtom(visibleAudioPlayerUrlAtom);
  const visibleAudioPlayerUrl = useAtomValue(visibleAudioPlayerUrlAtom);

  const isCurrentAudio = currentAudio?.url === url;
  const isCurrentlyPlaying = isCurrentAudio && isPlaying;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setVisibleAudioPlayerUrl(url);
        } else if (visibleAudioPlayerUrl === url) {
          setVisibleAudioPlayerUrl(null);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    if (audioPlayerRef.current) {
      observer.observe(audioPlayerRef.current);
    }

    return () => {
      if (audioPlayerRef.current) {
        observer.unobserve(audioPlayerRef.current);
      }
      if (visibleAudioPlayerUrl === url) {
        setVisibleAudioPlayerUrl(null);
      }
    };
  }, [url, setVisibleAudioPlayerUrl, visibleAudioPlayerUrl]);

  useEffect(() => {
    if (isCurrentAudio && isVisible !== null) {
      if (isVisible) {
        hideMiniPlayer();
      } else if (currentAudio) {
        showMiniPlayer();
      }
    }
  }, [isCurrentAudio, isVisible, currentAudio, hideMiniPlayer, showMiniPlayer]);

  useEffect(() => {
    return () => {
      if (isCurrentAudio && currentAudio) {
        showMiniPlayer();
      }
    };
  }, [isCurrentAudio, currentAudio, showMiniPlayer]);

  const handlePlayPause = () => {
    if (isCurrentlyPlaying) {
      pauseAudio();
    } else {
      const audioData: AudioMetadata = {
        url,
        title,
        artist: author,
        cover,
        postId: postId || "",
      };
      playAudio(audioData);

      if (isVisible === false) {
        showMiniPlayer();
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    setDragValue(value);
    setIsDragging(true);
  };

  const handleProgressMouseUp = () => {
    if (!isDragging || !isCurrentAudio) return;

    if (duration > 0) {
      const newTime = (dragValue / 100) * duration;
      seekAudio(newTime);
    }
    setIsDragging(false);
  };

  const currentProgressPercentage = isDragging ? dragValue : isCurrentAudio ? progressPercentage : 0;

  return (
    <div
      ref={audioPlayerRef}
      className="w-full bg-gradient-to-r from-zinc-100/20 dark:from-zinc-800/50 to-zinc-200/30 dark:to-zinc-900/50 backdrop-blur-md rounded-md overflow-hidden flex items-center gap-4 relative max-h-24"
    >
      <div className="h-24 aspect-square overflow-hidden flex-shrink-0">
        <img src={cover} alt={title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 pr-4 space-y-1">
        <div className="flex items-center gap-2">
          <div>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full select-none flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 active:scale-95 hover:scale-105 transition-all duration-150 flex-shrink-0"
            >
              {isCurrentlyPlaying ? (
                <PauseIcon size={24} className="dark:text-white text-black" />
              ) : (
                <PlayIcon size={24} className="dark:text-white text-black ml-1" />
              )}
            </button>
          </div>

          <div className="dark:text-white text-black mb-1">
            <div className="font-semibold text-lg truncate">{title}</div>
            <div className="dark:text-zinc-400 text-zinc-600 text-sm truncate">{author}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-2 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-black dark:bg-white rounded-full transition-all duration-150"
              style={{ width: `${currentProgressPercentage}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={currentProgressPercentage}
              onChange={handleProgressChange}
              onMouseUp={handleProgressMouseUp}
              onTouchEnd={handleProgressMouseUp}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer active:opacity-85"
              disabled={!isCurrentAudio}
            />
          </div>

          <button
            onClick={toggleTimeDisplay}
            className="dark:text-white text-black text-sm font-mono hover:opacity-80 transition-opacity cursor-pointer select-none min-w-12 text-right"
            disabled={!isCurrentAudio}
          >
            {isCurrentAudio ? displayTime : "0:00"}
          </button>
        </div>
      </div>
    </div>
  );
};
