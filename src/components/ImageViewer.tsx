"use client";

import { CopyIcon, DownloadIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactPlayer from "react-player";
import { toast } from "sonner";
import { useVideoState } from "../hooks/useVideoState";
import { Button } from "./ui/button";
import { VideoPlayer } from "./VideoPlayer";

export function ImageViewer({
  src,
  alt,
  className,
  galleryItems,
  currentIndex,
}: {
  src: string;
  alt?: string;
  className?: string;
  galleryItems?: any[];
  currentIndex?: number;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [direction, setDirection] = useState(0);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoId = useRef(`imageviewer-video-${Math.random().toString(36).substring(2, 11)}`).current;
  const { pauseAllOtherVideos } = useVideoState(videoId);

  // If galleryItems is provided, use VideoPlayer for unified gallery experience
  if (galleryItems && galleryItems.length > 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <VideoPlayer
          url={src}
          preview=""
          galleryItems={galleryItems}
          currentIndex={currentIndex}
          autoplay={false}
          useModal={true}
        />
      </div>
    );
  }

  const close = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setOpen(false);
    setScale(1);
    setActiveIndex(currentIndex || 0);
    setIsInitialOpen(true);
  };

  const zoomIn = () => setScale((s) => s + 0.25);
  const zoomOut = () => setScale((s) => Math.max(0.25, s - 0.25));
  const toggleZoom = () => setScale((s) => (s === 1 ? 2 : 1));

  const isImageType = (type: string): boolean => {
    const imageTypes = ["PNG", "JPEG", "GIF", "BMP", "WEBP", "SVG_XML", "TIFF", "AVIF", "HEIC", "X_MS_BMP"];
    return type.startsWith("image") || imageTypes.includes(type);
  };

  const goToPrevious = () => {
    if (galleryItems && galleryItems.length > 1) {
      setIsInitialOpen(false);
      setDirection(-1);
      setActiveIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      setScale(1);
    }
  };

  const goToNext = () => {
    if (galleryItems && galleryItems.length > 1) {
      setIsInitialOpen(false);
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % galleryItems.length);
      setScale(1);
    }
  };

  const getCurrentItem = () => {
    return galleryItems?.[activeIndex] || { item: src, type: "image" };
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowLeft" && galleryItems && galleryItems.length > 1) {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight" && galleryItems && galleryItems.length > 1) {
        event.preventDefault();
        goToNext();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, galleryItems, activeIndex]);

  const handleDownload = async () => {
    try {
      const currentItem = getCurrentItem();
      const response = await fetch(currentItem.item);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt || "image";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleCopy = async () => {
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

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setTimeout(() => close(), 0);
          }}
        >
          <div className="absolute z-[60] right-4 top-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" onClick={zoomIn} aria-label="Zoom in">
              <ZoomInIcon size={20} />
            </Button>
            <Button variant="secondary" size="icon" onClick={zoomOut} aria-label="Zoom out">
              <ZoomOutIcon size={20} />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleCopy} aria-label="Copy image">
              <CopyIcon size={20} />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleDownload} aria-label="Download">
              <DownloadIcon size={20} />
            </Button>
            <Button variant="secondary" size="icon" onClick={(e) => close(e as any)} aria-label="Close">
              <XIcon size={20} />
            </Button>
          </div>

          {galleryItems && galleryItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[60] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[60] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Next image"
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
              >
                {(() => {
                  const currentItem = getCurrentItem();

                  return isImageType(String(currentItem.type)) ? (
                    <motion.img
                      src={currentItem.item}
                      alt={alt}
                      animate={{ scale }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleZoom();
                      }}
                      className={`max-h-full max-w-full object-contain ${scale === 1 ? "cursor-zoom-in" : "cursor-zoom-out"}`}
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ReactPlayer
                        playing={true}
                        controls={true}
                        muted={false}
                        height="100%"
                        width="100%"
                        url={currentItem.item}
                        loop
                        style={{ transform: `scale(${scale})` }}
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
                    setScale(1);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? "bg-white" : "bg-white/50"}`}
                  aria-label={`Go to image ${index + 1}`}
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
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      />
      {typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
