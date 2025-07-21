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
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [initialAutoplayDone, setInitialAutoplayDone] = useState(false);
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
        pauseAllOtherVideos();
      },
      () => {
        if (!modalOpen) {
          setPlaying(false);
        }
      }
    );
  }, [registerPlayer, registerAutoplayCallbacks, modalOpen, pauseAllOtherVideos]);

  // Check if video should autoplay on initial mount when already in viewport
  useEffect(() => {
    if (!autoplay || !autoplayRef.current) return;

    const checkInitialVisibility = () => {
      if (!autoplayRef.current) return;
      
      const rect = autoplayRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;
      
      // If video is already visible enough on mount, trigger autoplay
      if (visibleRatio >= autoplayThreshold && rect.top < windowHeight && rect.bottom > 0 && !initialAutoplayDone) {
        setShown(true);
        setPlaying(true);
        setMuted(true);
        setInitialAutoplayDone(true);
        pauseAllOtherVideos();
      }
    };

    // Check immediately
    checkInitialVisibility();
    
    // Also check after a brief delay to handle cases where the layout hasn't settled
    const timeoutId = setTimeout(checkInitialVisibility, 200);
    
    return () => clearTimeout(timeoutId);
  }, [autoplay, autoplayThreshold, pauseAllOtherVideos, initialAutoplayDone]);

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
          if (!muted) {
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
        if (modalOpen && modalVideoRef.current) {
          const currentTime = modalVideoRef.current.currentTime;
          const newTime = Math.max(0, currentTime - 10);
          modalVideoRef.current.currentTime = newTime;
        } else if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const newTime = Math.max(0, currentTime - 10);
          playerRef.current.seekTo(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (modalOpen && modalVideoRef.current) {
          const currentTime = modalVideoRef.current.currentTime;
          const duration = modalVideoRef.current.duration;
          const newTime = Math.min(duration, currentTime + 10);
          modalVideoRef.current.currentTime = newTime;
        } else if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          const newTime = Math.min(duration, currentTime + 10);
          playerRef.current.seekTo(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (modalOpen && modalVideoRef.current && details.seekTime !== null) {
          modalVideoRef.current.currentTime = details.seekTime;
        } else if (playerRef.current && details.seekTime !== null) {
          playerRef.current.seekTo(details.seekTime);
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
      setTimeout(() => {
        if (modalVideoRef.current) {
          modalVideoRef.current.currentTime = currentTime;
          if (!muted) {
            stopAudio();
            pauseAllOtherVideos();
          }
        }
      }, 20);
    } else {
      // When closing modal, sync the time back to preview
      if (modalVideoRef.current && playerRef.current) {
        const currentTime = modalVideoRef.current.currentTime;
        playerRef.current.seekTo(currentTime);
      }
      setModalOpen(false);
      setIsFullscreen(false);
    }
    return false;
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loadedSeconds: number }) => {    
    if ('mediaSession' in navigator) {
      if (modalOpen && modalVideoRef.current) {
        const duration = modalVideoRef.current.duration;
        if (duration && shown && !isNaN(duration)) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: state.playedSeconds
          });
        }
      } else if (playerRef.current) {
        const duration = playerRef.current.getDuration();
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
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
                      <div className="relative max-h-full max-w-full">
                        <video
                          ref={modalVideoRef}
                          src={currentItem.item}
                          className="max-h-[100vh] max-w-full"
                          style={{ objectFit: "contain", height: "auto", width: "auto" }}
                          autoPlay={playing}
                          muted={muted}
                          loop
                          onTimeUpdate={(e) => {
                            const video = e.currentTarget;
                            const played = video.currentTime / video.duration;
                            handleProgress({ played: played, playedSeconds: video.currentTime, loadedSeconds: 0 });
                          }}
                        />
                         {/* Mute/unmute button positioned relative to video */}
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
                          className="absolute bottom-4 right-4 z-[60] hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
                        >
                          {muted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                      </div>

                     
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

          {/* Mute/unmute button moved inside the video container */}
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
      onClick={handleFullscreen}
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
                      muted={muted || isFullscreen}
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
            className={`${shown ? "opacity-0" : "opacity-100"} transition-opacity flex items-center justify-center relative h-full w-full cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Always open modal when clicking on video preview
              setModalOpen(true);
              setIsFullscreen(true);
              setShown(true);
              setPlaying(true);
              if (!muted) {
                stopAudio();
                pauseAllOtherVideos();
              }
            }}
          >
            {(() => {
              const currentItem = getCurrentItem();
              if (currentItem.type && isImageType(String(currentItem.type))) {
                return (
                  <>
                    <img src={currentItem.item} alt="" className="h-full w-full object-cover rounded-xl mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200">
                        <svg className="w-8 h-8 text-primary fill-primary" viewBox="0 0 24 24">
                          <path d="M8.5 8.5v7l7-3.5z" />
                        </svg>
                      </div>
                    </div>
                  </>
                );
              }
              // For videos, show the original preview or generate thumbnail
              const videoPreview = activeIndex === (currentIndex || 0) ? preview : "";
              return (
                <>
                  {videoPreview ? (
                    <>
                      <img
                        src={videoPreview}
                        alt="Video preview"
                        className="max-h-[500px] object-contain rounded-xl mx-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/30 transition-all duration-200">
                          <PlayIcon className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : generatedThumbnail && activeIndex === (currentIndex || 0) ? (
                    <>
                      <img src={generatedThumbnail} alt="" className="h-[300px] rounded-xl" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/30 transition-all duration-200">
                          <PlayIcon className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                      <VideoIcon className="w-16 h-16 text-muted-foreground" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/30 transition-all duration-200">
                          <PlayIcon className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
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
            setMuted(!muted)
          }}
            className="hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
          >
            { muted ? <VolumeOff className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
          </button>
        </div>
      )}
    </div>
    {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
};
