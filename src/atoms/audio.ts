import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface AudioMetadata {
  url: string;
  title: string;
  artist: string;
  cover: string;
  postId: string;
}

export const currentAudioAtom = atom<AudioMetadata | null>(null);
export const audioPlayingAtom = atom<boolean>(false);
export const audioCurrentTimeAtom = atom<number>(0);
export const audioDurationAtom = atom<number>(0);
export const audioVolumeAtom = atomWithStorage<number>("audio-volume", 1);
export const audioShowRemainingTimeAtom = atomWithStorage<boolean>("audio-show-remaining", false);

export const miniPlayerVisibleAtom = atom<boolean>(false);

const _visibleAudioPlayerUrlAtom = atom<string | null>(null);
export const visibleAudioPlayerUrlAtom = atom(
  (get) => get(_visibleAudioPlayerUrlAtom),
  (_get, set, url: string | null) => {
    set(_visibleAudioPlayerUrlAtom as any, url);
  },
);

const _globalAudioElementAtom = atom<HTMLAudioElement | null>(null);
export const globalAudioElementAtom = atom(
  (get) => get(_globalAudioElementAtom),
  (_get, set, audioElement: HTMLAudioElement | null) => {
    set(_globalAudioElementAtom as any, audioElement);
  },
);

export const audioProgressPercentageAtom = atom((get) => {
  const currentTime = get(audioCurrentTimeAtom);
  const duration = get(audioDurationAtom);
  return duration > 0 ? (currentTime / duration) * 100 : 0;
});

export const audioDisplayTimeAtom = atom((get) => {
  const currentTime = get(audioCurrentTimeAtom);
  const duration = get(audioDurationAtom);
  const showRemaining = get(audioShowRemainingTimeAtom);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (showRemaining && duration > 0) {
    const remaining = duration - currentTime;
    return `-${formatTime(remaining)}`;
  }

  return formatTime(currentTime);
});

export const playAudioAtom = atom(null, (get, set, audioData: AudioMetadata) => {
  const audioElement = get(globalAudioElementAtom);
  if (!audioElement) return;

  const currentAudio = get(currentAudioAtom);
  if (!currentAudio || currentAudio.url !== audioData.url) {
    audioElement.src = audioData.url;
    set(currentAudioAtom as any, audioData);
    set(audioCurrentTimeAtom as any, 0);
    set(audioDurationAtom as any, 0);
  }

  audioElement.play();
  set(audioPlayingAtom, true);

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: audioData.title,
      artist: audioData.artist,
      artwork: [
        { src: audioData.cover, sizes: "512x512", type: "image/png" },
        { src: audioData.cover, sizes: "256x256", type: "image/png" },
        { src: audioData.cover, sizes: "128x128", type: "image/png" },
        { src: audioData.cover, sizes: "96x96", type: "image/png" },
      ],
    });
  }
});

export const pauseAudioAtom = atom(null, (get, set) => {
  const audioElement = get(globalAudioElementAtom);
  if (audioElement) {
    audioElement.pause();
  }
  set(audioPlayingAtom, false);
});

export const stopAudioAtom = atom(null, (get, set) => {
  const audioElement = get(globalAudioElementAtom);
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  set(audioPlayingAtom, false);
  set(currentAudioAtom as any, null);
  set(audioCurrentTimeAtom as any, 0);
  set(audioDurationAtom as any, 0);
  set(miniPlayerVisibleAtom, false);
});

export const seekAudioAtom = atom(null, (get, set, time: number) => {
  const audioElement = get(globalAudioElementAtom);
  if (audioElement) {
    audioElement.currentTime = time;
    set(audioCurrentTimeAtom, time);
  }
});

export const setAudioVolumeAtom = atom(null, (get, set, volume: number) => {
  const audioElement = get(globalAudioElementAtom);
  if (audioElement) {
    audioElement.volume = volume;
  }
  set(audioVolumeAtom, volume);
});

export const toggleTimeDisplayAtom = atom(null, (get, set) => {
  const current = get(audioShowRemainingTimeAtom);
  set(audioShowRemainingTimeAtom, !current);
});

export const hideMiniPlayerAtom = atom(null, (_get, set) => {
  set(miniPlayerVisibleAtom, false);
});

export const showMiniPlayerAtom = atom(null, (get, set) => {
  const hasAudio = get(currentAudioAtom);
  if (hasAudio) {
    set(miniPlayerVisibleAtom, true);
  }
});
