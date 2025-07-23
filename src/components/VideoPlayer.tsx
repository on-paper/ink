"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSetAtom } from "jotai";
import {
  CopyIcon,
  DownloadIcon,
  PlayIcon,
  VideoIcon,
  Volume2,
  VolumeOff,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialAutoplayDone, setInitialAutoplayDone] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isProgressClicked, setIsProgressClicked] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [videoUnmutedStates, setVideoUnmutedStates] = useState<{ [index: number]: boolean }>({});
  const progressAnimationRef = useRef<number>();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const videoId = useRef(`video-${Math.random().toString(36).substring(2, 11)}`).current;
  const { registerPlayer, pauseAllOtherVideos, setUnmutedState } = useVideoState(videoId);
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

    const currentItem = galleryItems[activeIndex];
    const nextItem = galleryItems[newIndex];
    
    if (currentItem?.type && !isImageType(String(currentItem.type)) && !muted) {
      setVideoUnmutedStates(prev => ({ ...prev, [activeIndex]: true }));
    }

    setActiveIndex(newIndex);
    setImageScale(1); 

    if (nextItem.type && !isImageType(String(nextItem.type))) {
      setShown(true);
      setPlaying(true);
      
      const wasVideoUnmuted = videoUnmutedStates[newIndex];
      if (wasVideoUnmuted) {
        setMuted(false);
        stopAudio();
        pauseAllOtherVideos();
      } else {
        setMuted(true);
      }
    } else {
      setShown(true);
      setPlaying(false);
      setMuted(true);
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

  const handleImageDownload = async () => {
    try {
      const currentItem = getCurrentItem();
      const response = await fetch(currentItem.item);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "image";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleImageCopy = async () => {
    try {
      const currentItem = getCurrentItem();
      const response = await fetch(currentItem.item);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, "image/png");
        });

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": pngBlob,
          }),
        ]);

        URL.revokeObjectURL(img.src);
        toast.success("Image copied to clipboard");
      } else {
        throw new Error("Clipboard API not supported");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy image");
    }
  };

  const zoomIn = () => setImageScale((s) => s + 0.25);
  const zoomOut = () => setImageScale((s) => Math.max(0.25, s - 0.25));
  const toggleZoom = () => setImageScale((s) => (s === 1 ? 2 : 1));

  const updateProgressSmooth = () => {
    if (videoRef.current && !videoRef.current.paused) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        const progress = currentTime / duration;
        setVideoProgress(progress);
      }
      progressAnimationRef.current = requestAnimationFrame(updateProgressSmooth);
    }
  };

  useEffect(() => {
    registerPlayer(
      () => {
        setPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      () => {
        setMuted(true);
      }
    );

    registerAutoplayCallbacks(
      () => {
        if (!modalOpen) {
          pauseAllOtherVideos();
          setShown(true);
          setPlaying(true);
          setMuted(true);
        }
      },
      () => {
        if (!modalOpen) {
          setPlaying(false);
        }
      },
      () => !muted 
    );

    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
    };
  }, [registerPlayer, registerAutoplayCallbacks, modalOpen, pauseAllOtherVideos, muted]);

  useEffect(() => {
    if (!videoRef.current || !shown) return;
    
    const timeoutId = setTimeout(() => {
      if (!videoRef.current) return;
      
      if (playing && videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else if (!playing && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [playing, shown]);

  useEffect(() => {
    if (shown && playing) {
      setUnmutedState(!muted);
    }
  }, [muted, setUnmutedState, shown, playing]);

  useEffect(() => {
    if (!autoplay || !autoplayRef.current) return;

    const checkInitialVisibility = () => {
      if (!autoplayRef.current) return;

      const rect = autoplayRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;

      if (visibleRatio >= autoplayThreshold && rect.top < windowHeight && rect.bottom > 0 && !initialAutoplayDone) {
        pauseAllOtherVideos();
        setShown(true);
        setPlaying(true);
        setMuted(true);
        setInitialAutoplayDone(true);
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
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          const newTime = Math.max(0, currentTime - 10);
          videoRef.current.currentTime = newTime;
        }
      });

      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration;
          const newTime = Math.min(duration, currentTime + 10);
          videoRef.current.currentTime = newTime;
        }
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (videoRef.current && details.seekTime !== null) {
          videoRef.current.currentTime = details.seekTime;
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

  const handleFullscreen = () => {
    if (!modalOpen) {
      setModalOpen(true);
      setIsFullscreen(true);
      if (!muted) {
        stopAudio();
        pauseAllOtherVideos();
      }
    } else {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      setModalOpen(false);
      setIsFullscreen(false);
    }
    return false;
  };

  const handleProgress = (playedSeconds: number) => {
    if ("mediaSession" in navigator && videoRef.current) {
      const duration = videoRef.current.duration;
      if (duration && shown && !Number.isNaN(duration)) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: playedSeconds,
        });
      }
    }
  };

  useEffect(() => {
    
    if (modalOpen && galleryItems) {
      const currentItem = galleryItems[activeIndex];
      if (currentItem && currentItem.type && !isImageType(String(currentItem.type))) {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      }
    }
  }, [activeIndex, modalOpen, galleryItems]);

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

  useEffect(() => {
    if (!modalOpen || !galleryItems || galleryItems.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();

        const threshold = 10;
        if (e.deltaX > threshold && activeIndex < galleryItems.length - 1) {
          goToNext();
        } else if (e.deltaX < -threshold && activeIndex > 0) {
          goToPrevious();
        }
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [modalOpen, galleryItems, activeIndex, goToNext, goToPrevious]);

  useEffect(() => {
    if (!shown || !videoRef.current) return;

    const currentItem = getCurrentItem();
    const isVideo = currentItem.type ? !isImageType(String(currentItem.type)) : true;

    if (isVideo && videoRef.current.src !== currentItem.item) {
      videoRef.current.src = currentItem.item;
      videoRef.current.load();
    }

    const moveVideo = () => {
      if (!videoRef.current) return;

      setTimeout(() => {
        if (modalOpen && isVideo && modalContainerRef.current) {
          modalContainerRef.current.appendChild(videoRef.current);
          videoRef.current.className = "max-h-[100vh] max-w-full";
          videoRef.current.style.cssText = "object-fit: contain; height: auto; width: auto; display: block;";
        } else if (previewContainerRef.current && isVideo) {
          previewContainerRef.current.appendChild(videoRef.current);
          videoRef.current.className = "h-full w-full object-contain";
          videoRef.current.style.cssText = `max-height: ${preview !== "" ? "100%" : "300px"}; display: block;`;
        } else {
          videoRef.current.style.display = 'none';
        }
      }, 50);
    };

    requestAnimationFrame(moveVideo);
  }, [modalOpen, shown, activeIndex, playing]);

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
          }}
        >
          {/* Close button - always top right */}
          <div className="absolute z-[60] right-4 top-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setModalOpen(false);
                setIsFullscreen(false);
              }}
              className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
            >
              <XIcon className="w-7 h-7 text-zinc-200" />
            </button>
          </div>

          {/* Image controls - positioned left of close button when viewing images */}
          {(() => {
            const currentItem = getCurrentItem();
            const isCurrentImage = currentItem.type && isImageType(String(currentItem.type));
            
            return isCurrentImage ? (
              <div className="absolute z-[60] right-16 top-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
                  aria-label="Zoom in"
                >
                  <ZoomInIcon className="w-5 h-5 text-zinc-200" />
                </button>
                <button
                  type="button"
                  onClick={zoomOut}
                  className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
                  aria-label="Zoom out"
                >
                  <ZoomOutIcon className="w-5 h-5 text-zinc-200" />
                </button>
                <button
                  type="button"
                  onClick={handleImageCopy}
                  className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
                  aria-label="Copy image"
                >
                  <CopyIcon className="w-5 h-5 text-zinc-200" />
                </button>
                <button
                  type="button"
                  onClick={handleImageDownload}
                  className="w-10 h-10 rounded-full bg-zinc-500/50 hover:bg-zinc-800/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
                  aria-label="Download image"
                >
                  <DownloadIcon className="w-5 h-5 text-zinc-200" />
                </button>
              </div>
            ) : null;
          })()}

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

          <div className="flex items-center justify-start h-full min-w-full overflow-hidden">
          {(galleryItems || [{ item: url, type: "video" }]).map((item, index) => (
            <motion.div key={index}
            className="flex items-center justify-center h-full min-w-[100vw]"
            animate={{ x: `calc(50vw - ${activeIndex * 100 + 50}vw)` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: `${(galleryItems?.length || 1) * 100}vw` }}
          >
            {item.type && isImageType(String(item.type)) ? (
                    <motion.img
                      src={item.item}
                      alt="Gallery item"
                      className={`max-h-full max-w-full object-contain ${imageScale === 1 ? "cursor-zoom-in" : "cursor-zoom-out"}`}
                      animate={{ scale: index === activeIndex ? imageScale : 1 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index === activeIndex) {
                          toggleZoom();
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="relative max-h-full max-w-full">
                        <div
                          className="relative max-h-full max-w-full"
                          ref={index === activeIndex ? modalContainerRef : null}
                        />
                          <>
                            <div className="absolute bottom-0 w-full p-3 z-[65]">
                              <div className="max-w-2xl mx-auto w-full">
                                <div
                                  className="bg-white/20 h-1 rounded-full cursor-pointer hover:h-1.5 transition-all duration-200 relative"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setIsProgressClicked(true);
                                    if (videoRef.current) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const clickX = e.clientX - rect.left;
                                      const clickRatio = clickX / rect.width;
                                      const newTime = clickRatio * videoRef.current.duration;
                                      videoRef.current.currentTime = Math.max(
                                        0,
                                        Math.min(newTime, videoRef.current.duration),
                                      );
                                    }
                                  }}
                                  onMouseUp={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
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
                                const newMutedState = !muted;
                                setMuted(newMutedState);
                                
                                const currentItem = getCurrentItem();
                                if (currentItem.type && !isImageType(String(currentItem.type))) {
                                  setVideoUnmutedStates(prev => ({ 
                                    ...prev, 
                                    [activeIndex]: !newMutedState 
                                  }));
                                }
                                
                                if (muted) {
                                  stopAudio();
                                  pauseAllOtherVideos();
                                }
                              }}
                              className="absolute bottom-5 right-5 z-[60] hover:scale-110 active:opacity-60 active:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-4"
                            >
                              {muted ? <VolumeOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                          </>
                      </div>
                    </div>
                  )}
            {/* <div className="h-80 bg-red-300 min-w-[100vw]" key={index}>item {index}</div> */}
            </motion.div>
          ))}
          
          </div>

          {galleryItems && galleryItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[60] flex gap-2">
              {galleryItems.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(index);
                    navigateToItem(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Single video element that gets moved between containers dynamically */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        muted={muted}
        loop
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          const played = video.currentTime / video.duration;
          setVideoProgress(played);
          handleProgress(video.currentTime);
        }}
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
        style={{ display: 'none' }} 
      />
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
                    <div className="h-full w-full flex items-center justify-center">
                      <div ref={previewContainerRef} className="h-full w-full flex items-center justify-center">
                        {/* Video element will be moved here dynamically by useEffect */}
                      </div>
                    </div>
                  );
                })()}
            </div>

            <div
              className={`${shown ? "opacity-0" : "opacity-100"} transition-opacity flex items-center justify-center relative h-full w-full cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
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
                    <div className="h-full max-h-[300px] w-auto relative">
                      <img src={currentItem.item} alt="" className="w-auto h-[300px] object-cover rounded-xl mx-auto" />
                    </div>
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
                          className="max-h-[300px] object-contain rounded-xl mx-auto"
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

            {!modalOpen && (
              <div className="z-10 absolute bottom-0 right-0 p-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const newMutedState = !muted;
                    setMuted(newMutedState);
                    
                    const currentItem = getCurrentItem();
                    if (currentItem.type && !isImageType(String(currentItem.type))) {
                      setVideoUnmutedStates(prev => ({ 
                        ...prev, 
                        [activeIndex]: !newMutedState 
                      }));
                    }
                    
                    if (muted) {
                      stopAudio();
                      pauseAllOtherVideos();
                    }
                  }}
                  className="rounded-full p-1.5 group/mutebutton"
                  >
                  <div
                  className="group-hover/mutebutton:scale-110 group-active/mutebutton:opacity-60 group-active/mutebutton:scale-95 select-none transition-all duration-200 text-zinc-200 bg-zinc-500/30 backdrop-blur-sm rounded-full p-2"
                  >

                  {muted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
};
