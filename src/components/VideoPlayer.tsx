"use client";

import { MaximizeIcon, MinimizeIcon, PauseIcon, PlayIcon, VideoIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import { useAtomValue, useSetAtom } from "jotai";
import { useVideoState } from "../hooks/useVideoState";
import { Progress } from "./ui/video-progress";
import {
  currentVideoAtom,
  videoPlayingAtom,
  videoCurrentTimeAtom,
  videoDurationAtom,
  playVideoAtom,
  pauseVideoAtom,
  hideMiniVideoPlayerAtom,
  showMiniVideoPlayerAtom,
  globalReactPlayerAtom,
  type VideoMetadata,
} from "../atoms/video";

// when a video has no preview, we generate a thumbnail from the video
const generateVideoThumbnail = (videoUrl: string): Promise<{ thumbnail: string; aspectRatio: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';
    video.muted = true;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 0;
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        const aspectRatio = video.videoHeight / video.videoWidth;
        resolve({ thumbnail, aspectRatio });
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    video.onerror = (error) => {
      reject(new Error(`Video loading failed: ${error}`));
    };

    video.src = videoUrl;
  });
};

export const VideoPlayer = ({ url, preview, galleryItems, currentIndex, postId }: { url: string; preview: string; galleryItems?: any[]; currentIndex?: number; postId?: string }) => {
  const playerWithControlsRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  const [localPlaying, setLocalPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(screenfull.isFullscreen);
  const [shown, setShown] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [isVisible, setIsVisible] = useState(true);

  const currentVideo = useAtomValue(currentVideoAtom);
  const globalPlaying = useAtomValue(videoPlayingAtom);
  const playVideo = useSetAtom(playVideoAtom);
  const pauseVideo = useSetAtom(pauseVideoAtom);
  const hideMiniVideoPlayer = useSetAtom(hideMiniVideoPlayerAtom);
  const showMiniVideoPlayer = useSetAtom(showMiniVideoPlayerAtom);
  const setGlobalReactPlayer = useSetAtom(globalReactPlayerAtom);
  const setCurrentTime = useSetAtom(videoCurrentTimeAtom);
  const setDuration = useSetAtom(videoDurationAtom);

  const videoId = useRef(`video-${Math.random().toString(36).substring(2, 11)}`).current;
  const { registerPlayer, pauseAllOtherVideos } = useVideoState(videoId);

  const isCurrentVideo = currentVideo?.url === url;
  const playing = isCurrentVideo ? globalPlaying : localPlaying;

  const isImageType = (type: string): boolean => {
    const imageTypes = ["PNG", "JPEG", "GIF", "BMP", "WEBP", "SVG_XML", "TIFF", "AVIF", "HEIC", "X_MS_BMP"];
    return type.startsWith("image/") || imageTypes.includes(type);
  };

  const navigateToItem = (newIndex: number) => {
    if (!galleryItems || galleryItems.length <= 1) return;

    const nextItem = galleryItems[newIndex];
    setActiveIndex(newIndex);

    if (nextItem.type && !isImageType(String(nextItem.type))) {
      setShown(true);
      setLocalPlaying(true);
      setMuted(false);
      pauseAllOtherVideos();
    } else {
      setShown(true);
      setLocalPlaying(false);
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

  const isIOSVideo = (videoUrl: string): boolean => {
    return false;

    // return videoUrl.toLowerCase().includes('.mov') ||
    //   videoUrl.toLowerCase().includes('.m4v') ||
    //   videoUrl.includes('ios') ||
    //   videoUrl.includes('iphone') ||
    //   videoUrl.includes('ipad');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (videoPlayerRef.current) {
      observer.observe(videoPlayerRef.current);
    }

    return () => {
      if (videoPlayerRef.current) {
        observer.unobserve(videoPlayerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCurrentVideo && playerRef.current) {
      setGlobalReactPlayer(playerRef.current);
    }
  }, [isCurrentVideo, setGlobalReactPlayer]);

  useEffect(() => {
    if (isCurrentVideo) {
      if (isVisible) {
        hideMiniVideoPlayer();
      } else if (currentVideo) {
        showMiniVideoPlayer();
      }
    }
  }, [isCurrentVideo, isVisible, currentVideo, hideMiniVideoPlayer, showMiniVideoPlayer]);

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
      setLocalPlaying(false);
      if (isCurrentVideo) {
        pauseVideo();
      }
    });
  }, [registerPlayer, isCurrentVideo, pauseVideo]);

  const handlePlayPause = () => {
    if (!playing) {
      pauseAllOtherVideos();
    }
    
    console.log('Video Player - handlePlayPause:', { 
      url, 
      isCurrentVideo, 
      playing, 
      currentVideoUrl: currentVideo?.url,
      postId 
    });
    
    // Always use global state to set the current video
    const videoData: VideoMetadata = {
      url,
      preview,
      postId: postId || '',
      galleryItems,
      currentIndex: activeIndex,
    };
    
    if (playing) {
      pauseVideo();
    } else {
      playVideo(videoData);
    }
    
    setLocalPlaying(!playing);
    setMuted(false);
  };

  const handleFullscreen = () => {
    if (!screenfull.isEnabled || !playerWithControlsRef.current) {
      return;
    }
    const player = playerWithControlsRef.current;
    screenfull.toggle(player, { navigationUI: "hide" }).catch((error) => {
      console.error("Error toggling fullscreen:", error);
    });
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loadedSeconds: number }) => {
    setProgress(state.played * 100);
    
    // Update global state if this is the current video
    if (isCurrentVideo && playerRef.current) {
      setCurrentTime(state.playedSeconds);
      const duration = playerRef.current.getDuration && playerRef.current.getDuration();
      if (duration) {
        setDuration(duration);
      }
    }
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
      generateVideoThumbnail(url)
        .then(({ thumbnail }) => {
          setGeneratedThumbnail(thumbnail);
        })
    }
  }, [url, preview, generatedThumbnail]);

  return (
    <div
      ref={(el) => {
        playerWithControlsRef.current = el;
        videoPlayerRef.current = el;
      }}
      className={`relative flex justify-center items-center rounded-lg overflow-hidden border 
        ${preview !== "" ? "max-h-[400px] w-fit" : "h-[300px]"}
        ${isFullscreen && "w-full"} 
      `}
      onClick={() => {
        if (isFullscreen) handleFullscreen();
      }}
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
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!shown) {
            setShown(true);
          }
          handlePlayPause();
        }}
        onKeyDown={(e) => {
          if (e.key === " ") {
            handlePlayPause();
          }
        }}
        className="relative h-full flex flex-col"
      >
        <div className="relative flex-1">
          <div className={`${isFullscreen ? "fixed" : "absolute"} inset-0`}>
            {shown && (() => {
              const currentItem = getCurrentItem();
              return currentItem.type && isImageType(String(currentItem.type)) ? (
                <img
                  src={currentItem.item}
                  alt="Gallery item"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{
                    transform: isFullscreen && isIOSVideo(currentItem.item) ? 'rotate(180deg)' : 'none',
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

          <div className={`${shown ? "opacity-0" : "opacity-100"} transition-opacity flex items-center justify-center relative h-full w-full`}>
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
              } else {
                // For videos, show the original preview or generate thumbnail
                const videoPreview = activeIndex === (currentIndex || 0) ? preview : "";
                return (
                  <>
                    {videoPreview ? (
                      <img src={videoPreview} alt="Video preview" className="max-h-[500px] object-contain rounded-xl mx-auto" />
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
                        }}
                      >
                        <PlayIcon className="w-8 h-8 text-primary fill-primary ml-1" />
                      </button>
                    </div>
                  </>
                );
              }
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
                    setLocalPlaying(false);
                    navigateToItem(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? "bg-white" : "bg-white/50"
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
          className="z-10 w-full border-t transition-all absolute bottom-0 flex justify-between items-center backdrop-blur-sm text-secondary-foreground p-2 bg-secondary/50 cursor-pointer"
        >
          <button type="button" onClick={handlePlayPause}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <Progress
            ref={progressRef}
            onChange={handleSeekChange}
            playing={playing}
            setPlaying={setLocalPlaying}
            className="mx-2 h-2"
            value={progress}
          />
          {screenfull.isEnabled && (
            <button type="button" onClick={handleFullscreen}>
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
