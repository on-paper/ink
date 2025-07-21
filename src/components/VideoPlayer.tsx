"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSetAtom } from "jotai";
import { PlayIcon, VideoIcon, Volume2, VolumeOff, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactPlayer from "react-player";
import { stopAudioAtom } from "../atoms/audio";
import { useVideoAutoplay } from "../hooks/useVideoAutoplay";
import { useVideoState } from "../hooks/useVideoState";

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
  const [modalMuted, setModalMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [initialAutoplayDone, setInitialAutoplayDone] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isProgressClicked, setIsProgressClicked] = useState(false);
  const progressAnimationRef = useRef<number>();
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
      if (!modalMuted) {
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

  const updateProgressSmooth = () => {
    if (modalVideoRef.current && !modalVideoRef.current.paused) {
      const currentTime = modalVideoRef.current.currentTime;
      const duration = modalVideoRef.current.duration;
      if (duration > 0) {
        const progress = currentTime / duration;
        setVideoProgress(progress);
        console.log("Progress:", progress); // Debug log
      }
      progressAnimationRef.current = requestAnimationFrame(updateProgressSmooth);
    }
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
      },
    );
  }, [registerPlayer, registerAutoplayCallbacks, modalOpen, pauseAllOtherVideos]);

  useEffect(() => {
    if (!autoplay || !autoplayRef.current) return;

    const checkInitialVisibility = () => {
      if (!autoplayRef.current) return;

      const rect = autoplayRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;

      if (visibleRatio >= autoplayThreshold && rect.top < windowHeight && rect.bottom > 0 && !initialAutoplayDone) {
        setShown(true);
        setPlaying(true);
        setMuted(true);
        setInitialAutoplayDone(true);
        pauseAllOtherVideos();
      }
    };

    checkInitialVisibility();

    const timeoutId = setTimeout(checkInitialVisibility, 200);

    return () => clearTimeout(timeoutId);
  }, [autoplay, autoplayThreshold, pauseAllOtherVideos, initialAutoplayDone]);

  useEffect(() => {
    if ("mediaSession" in navigator && shown) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: authorHandle ? `Video by @${authorHandle}` : "Video",
        artist: "Pingpad",
        artwork: [{ src: preview || generatedThumbnail || "", sizes: "512x512", type: "image/jpeg" }],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        if (!playing) {
          setPlaying(true);
          if (!muted) {
            stopAudio();
            pauseAllOtherVideos();
          }
        }
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        if (playing) {
          setPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", () => {
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

      navigator.mediaSession.setActionHandler("seekforward", () => {
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

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (modalOpen && modalVideoRef.current && details.seekTime !== null) {
          modalVideoRef.current.currentTime = details.seekTime;
        } else if (playerRef.current && details.seekTime !== null) {
          playerRef.current.seekTo(details.seekTime);
        }
      });

      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }

    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      }
    };
  }, [shown, playing, muted, preview, generatedThumbnail, stopAudio, pauseAllOtherVideos, modalOpen]);

  const syncTimeToModal = () => {
    if (playerRef.current && modalVideoRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      modalVideoRef.current.currentTime = currentTime;
    }
  };

  const syncTimeToPreview = () => {
    if (modalVideoRef.current && playerRef.current) {
      const currentTime = modalVideoRef.current.currentTime;
      playerRef.current.seekTo(currentTime);
    }
  };

  const handleFullscreen = () => {
    if (!modalOpen && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      setModalOpen(true);
      setIsFullscreen(true);
      setModalMuted(muted);
      setTimeout(() => {
        if (modalVideoRef.current) {
          modalVideoRef.current.currentTime = currentTime;
          if (!muted) {
            stopAudio();
            pauseAllOtherVideos();
          }
        }
      }, 25);
    } else {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      syncTimeToPreview();
      setMuted(modalMuted);
      setModalOpen(false);
      setIsFullscreen(false);
      setVideoProgress(0);
    }
    return false;
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loadedSeconds: number }) => {
    if ("mediaSession" in navigator) {
      if (modalOpen && modalVideoRef.current) {
        const duration = modalVideoRef.current.duration;
        if (duration && shown && !Number.isNaN(duration)) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: state.playedSeconds,
          });
        }
      } else if (playerRef.current) {
        const duration = playerRef.current.getDuration();
        if (duration && shown) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: state.playedSeconds,
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
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (!modalOpen) return;

      if (e.key === "Escape") {
        syncTimeToPreview();
        setMuted(modalMuted);
        setModalOpen(false);
        setIsFullscreen(false);
      }

      if (e.key === "ArrowLeft" && galleryItems && galleryItems.length > 1) {
        e.preventDefault();
        goToPrevious();
      }

      if (e.key === "ArrowRight" && galleryItems && galleryItems.length > 1) {
        e.preventDefault();
        goToNext();
      }
    };

    if (modalOpen) {
      document.addEventListener("keydown", handleGlobalKeydown);
    }

    return () => {
      document.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [modalOpen, galleryItems, goToPrevious, goToNext]);

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
            syncTimeToPreview();
            setMuted(modalMuted);
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
                syncTimeToPreview();
                setMuted(modalMuted);
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
                          muted={modalMuted}
                          loop
                          onPlay={() => {
                            if (progressAnimationRef.current) {
                              cancelAnimationFrame(progressAnimationRef.current);
                            }
                            updateProgressSmooth();
                          }}
                          onPause={() => {
                            if (progressAnimationRef.current) {
                              cancelAnimationFrame(progressAnimationRef.current);
                            }
                          }}
                          onTimeUpdate={(e) => {
                            const video = e.currentTarget;
                            const played = video.currentTime / video.duration;
                            setVideoProgress(played);
                            handleProgress({ played: played, playedSeconds: video.currentTime, loadedSeconds: 0 });

                            // Ensure smooth updates are running
                            if (!progressAnimationRef.current && !video.paused) {
                              updateProgressSmooth();
                            }
                          }}
                        />
                        {/* Mute/unmute button positioned relative to video */}
                        {/* Progress bar */}
                        <div className="absolute bottom-0 w-full p-3 z-[65]">
                          <div className="max-w-2xl mx-auto w-full">
                            <div
                              className="bg-white/20 h-1 rounded-full cursor-pointer hover:h-1.5 transition-all duration-200 relative"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsProgressClicked(true);
                                if (modalVideoRef.current) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickX = e.clientX - rect.left;
                                  const clickRatio = clickX / rect.width;
                                  const newTime = clickRatio * modalVideoRef.current.duration;
                                  modalVideoRef.current.currentTime = Math.max(
                                    0,
                                    Math.min(newTime, modalVideoRef.current.duration),
                                  );
                                }
                              }}
                              onMouseUp={(e) => {
                                e.stopPropagation();
                                setIsProgressClicked(false);
                              }}
                            >
                              <div
                                className={`bg-white h-full transition-all rounded-full ease-linear ${
                                  isProgressClicked ? "duration-75" : "duration-300"
                                }`}
                                style={{ width: `${videoProgress * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setModalMuted(!modalMuted);
                            if (modalMuted) {
                              stopAudio();
                              pauseAllOtherVideos();
                            }
                          }}
                          className="absolute bottom-5 right-5 z-[60] hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-4"
                        >
                          {modalMuted ? <VolumeOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
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
        className={`relative flex justify-center items-center rounded-lg overflow-hidden active:scale-[98%] transition-all
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
                      // style={{ minHeight: preview !== "" ? "auto" : "300px" }}
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
                      />
                    </div>
                  );
                })()}
            </div>

            <div
              className={`${shown ? "opacity-0" : "opacity-100"} transition-opacity flex items-center justify-center relative h-full w-full cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const currentTime = playerRef.current?.getCurrentTime() || 0;
                setModalOpen(true);
                setIsFullscreen(true);
                setShown(true);
                setPlaying(true);
                setModalMuted(muted);
                if (!muted) {
                  stopAudio();
                  pauseAllOtherVideos();
                }
                setTimeout(() => {
                  if (modalVideoRef.current) {
                    modalVideoRef.current.currentTime = currentTime;
                  }
                }, 25);
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

            {shown && (
              <div className="z-10 absolute bottom-0 right-0 p-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMuted(!muted);
                    if (!muted) {
                      stopAudio();
                      pauseAllOtherVideos();
                    }
                  }}
                  className="hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
                >
                  {muted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Gallery indicators now only in modal */}
          </div>
        </div>
      </div>
      {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
};
