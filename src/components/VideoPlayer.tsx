"use client";

import { PlayIcon, VideoIcon, Volume2, VolumeOff, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useVideoState } from "../hooks/useVideoState";
import { useVideoAutoplay } from "../hooks/useVideoAutoplay";
import { useSetAtom } from "jotai";
import { stopAudioAtom } from "../atoms/audio";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

// when a video has no preview, we generate a thumbnail from the video
const generateVideoThumbnail = (videoUrl: string): Promise<{ thumbnail: string; aspectRatio: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.crossOrigin = "anonymous";
    video.muted = true;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 0;
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        const aspectRatio = video.videoHeight / video.videoWidth;
        resolve({ thumbnail, aspectRatio });
      } else {
        reject(new Error("Canvas context not available"));
      }
    };

    video.onerror = (error) => {
      reject(new Error(`Video loading failed: ${error}`));
    };

    video.src = videoUrl;
  });
};

export const VideoPlayer = ({
  url,
  preview,
  galleryItems,
  currentIndex,
  autoplay = true,
  autoplayThreshold = 0.5,
  autoplayRootMargin = "-10% 0px",
  authorHandle,
  useModal = false,
}: {
  url: string;
  preview: string;
  galleryItems?: any[];
  currentIndex?: number;
  autoplay?: boolean;
  autoplayThreshold?: number;
  autoplayRootMargin?: string;
  authorHandle?: string;
  useModal?: boolean;
}) => {
  const playerWithControlsRef = useRef(null);
  const playerRef = useRef(null);
  const modalPlayerRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [isHovering, setIsHovering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const videoId = useRef(`video-${Math.random().toString(36).substring(2, 11)}`).current;
  const { registerPlayer, pauseAllOtherVideos } = useVideoState(videoId);
  const { ref: autoplayRef, registerAutoplayCallbacks } = useVideoAutoplay(videoId, {
    enabled: autoplay,
    threshold: autoplayThreshold,
    rootMargin: autoplayRootMargin,
  });
  const stopAudio = useSetAtom(stopAudioAtom);

  const isImageType = (type: string): boolean => {
    const imageTypes = ["PNG", "JPEG", "GIF", "BMP", "WEBP", "SVG_XML", "TIFF", "AVIF", "HEIC", "X_MS_BMP"];
    return type.startsWith("image/") || imageTypes.includes(type);
  };

  const navigateToItem = (newIndex: number) => {
    if (!galleryItems || galleryItems.length <= 1) return;

    const nextItem = galleryItems[newIndex];
    setIsInitialOpen(false);
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveIndex(newIndex);

    if (nextItem.type && !isImageType(String(nextItem.type))) {
      setShown(true);
      setPlaying(true);
      if (!muted) {
        stopAudio();
        pauseAllOtherVideos();
      }
    } else {
      setShown(true);
      setPlaying(false);
    }
  };

  const goToPrevious = () => {
    if (galleryItems && galleryItems.length > 1) {
      const newIndex = (activeIndex - 1 + galleryItems.length) % galleryItems.length;
      navigateToItem(newIndex);
    }
  };

  const goToNext = () => {
    if (galleryItems && galleryItems.length > 1) {
      const newIndex = (activeIndex + 1) % galleryItems.length;
      navigateToItem(newIndex);
    }
  };

  const getCurrentItem = () => {
    return galleryItems?.[activeIndex] || { item: url, type: "video" };
  };


  useEffect(() => {
    registerPlayer(() => {
      setPlaying(false);
    });
    
    registerAutoplayCallbacks(
      () => {
        setShown(true);
        setPlaying(true);
        setMuted(true);
      },
      () => {
        if (!modalOpen) {
          setPlaying(false);
        }
      }
    );
  }, [registerPlayer, registerAutoplayCallbacks, modalOpen]);

  useEffect(() => {
    if ('mediaSession' in navigator && shown) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: authorHandle ? `Video by @${authorHandle}` : 'Video',
        artist: 'Pingpad',
        artwork: [
          { src: preview || generatedThumbnail || '', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (!playing) {
          setPlaying(true);
          // Keep current mute state when playing via media session
          if (!muted && !previewMuted) {
            stopAudio();
            pauseAllOtherVideos();
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (playing) {
          setPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const activePlayer = modalOpen ? modalPlayerRef.current : playerRef.current;
        if (activePlayer) {
          const currentTime = activePlayer.getCurrentTime();
          const newTime = Math.max(0, currentTime - 10);
          activePlayer.seekTo(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        const activePlayer = modalOpen ? modalPlayerRef.current : playerRef.current;
        if (activePlayer) {
          const currentTime = activePlayer.getCurrentTime();
          const duration = activePlayer.getDuration();
          const newTime = Math.min(duration, currentTime + 10);
          activePlayer.seekTo(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        const activePlayer = modalOpen ? modalPlayerRef.current : playerRef.current;
        if (activePlayer && details.seekTime !== null) {
          activePlayer.seekTo(details.seekTime);
        }
      });

      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [shown, playing, muted, preview, generatedThumbnail, stopAudio, pauseAllOtherVideos, modalOpen]);


  const handleFullscreen = () => {
    if (!modalOpen && playerRef.current) {
      // Store current time before opening modal
      const currentTime = playerRef.current.getCurrentTime();
      setModalOpen(true);
      setIsFullscreen(true);
      // Don't change previewMuted here - keep the existing state
      // Sync time to modal player after it opens
      setTimeout(() => {
        if (modalPlayerRef.current) {
          modalPlayerRef.current.seekTo(currentTime);
          setMuted(previewMuted);
          if (!previewMuted) {
            stopAudio();
            pauseAllOtherVideos();
          }
        }
      }, 20);
    } else {
      // When closing modal, sync the mute state back to preview
      setPreviewMuted(muted);
      setModalOpen(false);
      setIsFullscreen(false);
    }
    return false;
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loadedSeconds: number }) => {
    setProgress(state.played * 100);
    
    if ('mediaSession' in navigator) {
      const activePlayer = modalOpen ? modalPlayerRef.current : playerRef.current;
      if (activePlayer) {
        const duration = activePlayer.getDuration();
        if (duration && shown) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: state.playedSeconds
          });
        }
      }
    }
  };

  const handleSeekChange = (value: number) => {
    const activePlayer = modalOpen ? modalPlayerRef.current : playerRef.current;
    if (activePlayer) {
      activePlayer.seekTo(value / 100);
      setProgress(value);
    }
  };

  useEffect(() => {
    if (preview) {
      const img = new Image();
      img.src = preview;
    }
  }, [preview]);

  useEffect(() => {
    if (!preview && url && !generatedThumbnail) {
      generateVideoThumbnail(url).then(({ thumbnail }) => {
        setGeneratedThumbnail(thumbnail);
      });
    }
  }, [url, preview, generatedThumbnail]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        handleFullscreen();
        // setModalOpen(false);
        // setPreviewMuted(muted);
        // setIsFullscreen(false);
        // setIsInitialOpen(true);
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [modalOpen, muted]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "33%" : "-33%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "33%" : "-33%",
      opacity: 0,
    }),
  };

  const modalContent = (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setPreviewMuted(muted);
            setModalOpen(false);
            setIsFullscreen(false);
            setIsInitialOpen(true);
          }}
        >
          <div className="absolute z-[60] right-4 top-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setPreviewMuted(muted);
                setModalOpen(false);
                setIsFullscreen(false);
                setIsInitialOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
            >
              <XIcon className="w-7 h-7 text-zinc-200" />
            </button>
          </div>

          {galleryItems && galleryItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[60] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[60] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="flex items-center justify-center h-full w-full overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                layout
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial={isInitialOpen ? "center" : "enter"}
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.15,
                }}
                className="flex items-center justify-center h-full w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const currentItem = getCurrentItem();
                  return currentItem.type && isImageType(String(currentItem.type)) ? (
                    <img src={currentItem.item} alt="Gallery item" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ReactPlayer
                        ref={modalPlayerRef}
                        playing={playing}
                        onProgress={handleProgress}
                        progressInterval={50}
                        controls={false}
                        muted={muted}
                        height="100%"
                        width="100%"
                        url={currentItem.item}
                        loop
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          {galleryItems && galleryItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[60] flex gap-2">
              {galleryItems.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInitialOpen(false);
                    setDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                    navigateToItem(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}

          {/* Mute/unmute button for fullscreen gallery view */}
          {(() => {
            const currentItem = getCurrentItem();
            const isVideo = currentItem.type && !isImageType(String(currentItem.type));
            return isVideo ? (
              <div className="absolute bottom-4 right-4 z-[60]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMuted(!muted);
                    if (muted) {
                      stopAudio();
                      pauseAllOtherVideos();
                    }
                  }}
                  className="hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
                >
                  {muted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            ) : null;
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
    <div
      ref={(node) => {
        playerWithControlsRef.current = node;
        autoplayRef.current = node;
      }}
      className={`relative flex justify-center items-center rounded-lg overflow-hidden 
        ${preview !== "" ? "max-h-[400px] w-fit" : "h-fit"}
      `}
      onClick={() => {
        if (modalOpen) handleFullscreen();
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={(e) => {
        if (e.key === "f") {
          handleFullscreen();
        }
        if (e.key === "Escape" && modalOpen) {
          handleFullscreen();
        }
        if (e.key === "ArrowLeft" && galleryItems && galleryItems.length > 1 && modalOpen) {
          e.preventDefault();
          goToPrevious();
        }
        if (e.key === "ArrowRight" && galleryItems && galleryItems.length > 1 && modalOpen) {
          e.preventDefault();
          goToNext();
        }
        return false;
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleFullscreen();
          return false;
        }}
        className="relative h-full flex flex-col"
      >
        <div className="relative flex-1">
          <div className="absolute inset-0">
            {shown &&
              (() => {
                const currentItem = getCurrentItem();
                return currentItem.type && isImageType(String(currentItem.type)) ? (
                  <img src={currentItem.item} alt="Gallery item" className="h-full w-full object-contain" />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center"
                  >
                    <ReactPlayer
                      ref={playerRef}
                      playing={playing}
                      onProgress={handleProgress}
                      progressInterval={50}
                      controls={false}
                      muted={previewMuted || isFullscreen}
                      height={preview !== "" ? "100%" : "300px"}
                      width="100%"
                      url={currentItem.item}
                      loop
                      style={{}}
                    />
                  </div>
                );
              })()}
          </div>

          {/* Removed in-player fullscreen controls - now handled by modal */}

          <div
            className={`${shown ? "opacity-0" : "opacity-100"} transition-opacity flex items-center justify-center relative h-full w-full`}
          >
            {(() => {
              const currentItem = getCurrentItem();
              if (currentItem.type && isImageType(String(currentItem.type))) {
                return (
                  <>
                    <img src={currentItem.item} alt="" className="h-full w-full object-cover rounded-xl mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                      <button
                        type="button"
                        className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setShown(true);
                        }}
                      >
                        <svg className="w-8 h-8 text-primary fill-primary" viewBox="0 0 24 24">
                          <path d="M8.5 8.5v7l7-3.5z" />
                        </svg>
                      </button>
                    </div>
                  </>
                );
              }
              // For videos, show the original preview or generate thumbnail
              const videoPreview = activeIndex === (currentIndex || 0) ? preview : "";
              return (
                <>
                  {videoPreview ? (
                    <img
                      src={videoPreview}
                      alt="Video preview"
                      className="max-h-[500px] object-contain rounded-xl mx-auto"
                    />
                  ) : generatedThumbnail && activeIndex === (currentIndex || 0) ? (
                    <img src={generatedThumbnail} alt="" className="h-[300px] rounded-xl" />
                  ) : (
                    <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                      <VideoIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Gallery indicators now only in modal */}
        </div>
      </div>

      {shown && (
        <div
          onKeyDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="z-10 transition-all absolute bottom-0 right-0 cursor-pointer p-2"
        >
          <button type="button" onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setPreviewMuted(!previewMuted);
          }}
            className="hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
          >
            { previewMuted ? <VolumeOff className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
          </button>
        </div>
      )}
    </div>
    {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
};
