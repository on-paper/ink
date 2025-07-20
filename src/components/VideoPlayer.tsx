"use client";

import { MaximizeIcon, MinimizeIcon, PauseIcon, PlayIcon, VideoIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import { useVideoState } from "../hooks/useVideoState";
import { useVideoAutoplay } from "../hooks/useVideoAutoplay";
import { Progress } from "./ui/video-progress";
import { useSetAtom } from "jotai";
import { stopAudioAtom } from "../atoms/audio";

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
      video.currentTime = 0; // Seek to 1 second
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
}: {
  url: string;
  preview: string;
  galleryItems?: any[];
  currentIndex?: number;
  autoplay?: boolean;
  autoplayThreshold?: number;
  autoplayRootMargin?: string;
}) => {
  const playerWithControlsRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(screenfull.isFullscreen);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [isHovering, setIsHovering] = useState(false);
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
    setActiveIndex(newIndex);

    if (nextItem.type && !isImageType(String(nextItem.type))) {
      // It's a video, start playing immediately
      setShown(true);
      setPlaying(true);
      setMuted(false);
      stopAudio();
      pauseAllOtherVideos();
    } else {
      // It's an image, just show it
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

  const isIOSVideo = (_videoUrl: string): boolean => {
    return false;

    // return videoUrl.toLowerCase().includes('.mov') ||
    //   videoUrl.toLowerCase().includes('.m4v') ||
    //   videoUrl.includes('ios') ||
    //   videoUrl.includes('iphone') ||
    //   videoUrl.includes('ipad');
  };

  useEffect(() => {
    if (screenfull.isEnabled) {
      const onFullscreenChange = () => {
        if (playerWithControlsRef.current && screenfull.element === playerWithControlsRef.current) {
          setIsFullscreen(screenfull.isFullscreen);
        } else {
          setIsFullscreen(false);
        }
      };

      screenfull.on("change", onFullscreenChange);

      return () => {
        screenfull.off("change", onFullscreenChange);
      };
    }
  }, []);

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
        if (!isFullscreen) {
          setPlaying(false);
        }
      }
    );
  }, [registerPlayer, registerAutoplayCallbacks, isFullscreen]);

  const handlePlayPause = () => {
    if (!playing) {
      setPlaying(true);
      setMuted(false);
      stopAudio();
    } else {
      if (muted) {
        setMuted(false);
        stopAudio();
      } else {
        setPlaying(false);
      }
    }
    return false;
  };

  const handleFullscreen = () => {
    if (!screenfull.isEnabled || !playerWithControlsRef.current) {
      return;
    }
    const player = playerWithControlsRef.current;
    if (muted) {
      setMuted(false);
      stopAudio();
    }

    screenfull.toggle(player, { navigationUI: "hide" }).then(() => {
    }).catch((error) => {
      console.error("Error toggling fullscreen:", error);
    });
    return false
  };

  const handleProgress = (state: { played: number }) => {
    setProgress(state.played * 100);
  };

  const handleSeekChange = (value: number) => {
    playerRef.current.seekTo(value / 100);
    setProgress(value);
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

  return (
    <div
      ref={(node) => {
        playerWithControlsRef.current = node;
        autoplayRef.current = node;
      }}
      className={`relative flex justify-center items-center rounded-lg overflow-hidden border 
        ${preview !== "" ? "max-h-[400px] w-fit" : "h-fit"}
        ${isFullscreen && "w-full"} 
      `}
      onClick={() => {
        if (isFullscreen) handleFullscreen();
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={(e) => {
        if (e.key === "f") {
          handleFullscreen();
        }
        if (e.key === "Escape" && isFullscreen) {
          handleFullscreen();
        }
        if (e.key === "ArrowLeft" && galleryItems && galleryItems.length > 1 && isFullscreen) {
          e.preventDefault();
          goToPrevious();
        }
        if (e.key === "ArrowRight" && galleryItems && galleryItems.length > 1 && isFullscreen) {
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
          handlePlayPause();
          return false;
        }}
        onKeyDown={(e) => {
          if (e.key === " ") {
            handlePlayPause();
          }
        }}
        className="relative h-full flex flex-col"
      >
        <div className="relative flex-1">
          <div className={`${isFullscreen ? "fixed inset-0" : "absolute inset-0"}`}>
            {shown &&
              (() => {
                const currentItem = getCurrentItem();
                return currentItem.type && isImageType(String(currentItem.type)) ? (
                  <img src={currentItem.item} alt="Gallery item" className="h-full w-full object-contain" />
                ) : (
                  <div
                    className={`h-full w-full flex items-center justify-center ${isFullscreen ? "fullscreen-video [&_video]:!object-contain [&_video]:!w-full [&_video]:!h-full" : ""}`}
                    style={{
                      transform: isFullscreen && isIOSVideo(currentItem.item) ? "rotate(180deg)" : "none",
                    }}
                  >
                    <ReactPlayer
                      ref={playerRef}
                      playing={playing}
                      onProgress={handleProgress}
                      progressInterval={50}
                      controls={false}
                      muted={muted}
                      height={isFullscreen ? "100%" : preview !== "" ? "100%" : "300px"}
                      width="100%"
                      url={currentItem.item}
                      loop
                      style={isFullscreen ? { objectFit: "contain" } : {}}
                    />
                  </div>
                );
              })()}
          </div>

          {/* Close X handle for fullscreen mode */}
          {isFullscreen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleFullscreen();
                return false;
              }}
              className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 active:opacity-60"
            >
              <XIcon className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Gallery navigation arrows for fullscreen mode */}
          {isFullscreen && galleryItems && galleryItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goToPrevious();
                }}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
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
                className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                    <button
                      type="button"
                      className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShown(true);
                        handlePlayPause();
                        return false;
                      }}
                    >
                      <PlayIcon className="w-8 h-8 text-primary fill-primary ml-1" />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Gallery indicators for fullscreen mode */}
          {galleryItems && galleryItems.length > 1 && isFullscreen && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
              {galleryItems.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPlaying(false);
                    navigateToItem(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to item ${index + 1}`}
                />
              ))}
            </div>
          )}
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
          className={`z-10 w-full border-t transition-all absolute bottom-0 flex justify-between items-center backdrop-blur-sm text-secondary-foreground p-2 bg-secondary/50 cursor-pointer ${
            !muted && !isHovering ? "opacity-0" : "opacity-100"
          }`}
        >
          <button type="button" onClick={handlePlayPause}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <Progress
            ref={progressRef}
            onChange={handleSeekChange}
            playing={playing}
            setPlaying={setPlaying}
            className="mx-2 h-2"
            value={progress}
          />
          {screenfull.isEnabled && (
            <button type="button" onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleFullscreen();
            }}>
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
