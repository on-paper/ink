"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageViewer } from "./ImageViewer";
import { VideoPlayer } from "./VideoPlayer";

export const extractConsecutiveMedia = (
  content: string,
): {
  mediaGroups: string[][];
  processedContent: string;
} => {
  const lines = content.split("\n");
  const mediaGroups: string[][] = [];
  let currentGroup: string[] = [];
  const processedLines: string[] = [];

  // markdown image regex
  const mediaRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.match(mediaRegex)) {
      const match = trimmedLine.match(mediaRegex);
      if (match) {
        const url = match[2];
        currentGroup.push(url);
      }

      // Look ahead to see if next lines are also media
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine === "") {
          // Empty line, could be separator
          j++;
        } else if (nextLine.match(mediaRegex)) {
          // Another media item
          const nextMatch = nextLine.match(mediaRegex);
          if (nextMatch) {
            const url = nextMatch[2];
            currentGroup.push(url);
          }
          i = j; // Skip this line in the main loop
          j++;
        } else {
          // Not media, stop collecting
          break;
        }
      }

      // Process collected media
      if (currentGroup.length > 1) {
        // Multiple items, create a gallery
        mediaGroups.push([...currentGroup]);
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== "") {
          processedLines.push("");
        }
        processedLines.push(`MEDIA_GALLERY_PLACEHOLDER_${mediaGroups.length - 1}`);
        processedLines.push("");
      } else if (currentGroup.length === 1) {
        // Single item, keep as-is
        processedLines.push(line);
      }

      currentGroup = [];
      i = j - 1; // Continue from where we stopped
    } else {
      // Regular line
      processedLines.push(line);
    }
  }

  return { mediaGroups, processedContent: processedLines.join("\n") };
};

export const MarkdownMediaGallery = ({ urls, mimeTypes }: { urls: string[]; mimeTypes?: Record<string, string> }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [urls]);

  const scrollToDirection = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="relative my-2 group">
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ height: "300px" }}
        onScroll={checkScrollButtons}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollToDirection("left");
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollToDirection("right");
          }
        }}
      >
        <div className="flex gap-2 h-full items-center" style={{ width: "max-content" }}>
          {urls.map((url, index) => {
            const mimeType = mimeTypes?.[url];
            const isVideo =
              mimeType?.startsWith("video/") || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|m4v)(\?|$)/);

            return (
              <div key={`gallery-media-${url}`} className="h-full flex items-center">
                {isVideo ? (
                  <div className="h-full flex items-center">
                    <VideoPlayer url={url} preview="" autoplay={index === 0} />
                  </div>
                ) : (
                  <ImageViewer
                    src={url}
                    alt=""
                    className="h-full max-h-[300px] w-auto object-contain border rounded-xl cursor-pointer"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      {urls.length > 1 && (
        <>
          <button
            onClick={() => scrollToDirection("left")}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white transition-opacity ${
              canScrollLeft ? "opacity-0 group-hover:opacity-100" : "hidden"
            }`}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scrollToDirection("right")}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white transition-opacity ${
              canScrollRight ? "opacity-0 group-hover:opacity-100" : "hidden"
            }`}
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export const MarkdownMediaItem = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const isVideo = mimeType?.startsWith("video/");
  if (isVideo) {
    return (
      <span className="inline-block my-2 w-fit">
        <VideoPlayer url={url} preview="" autoplay={true} />
      </span>
    );
  }

  return (
    <span className="inline-block max-w-md">
      <ImageViewer src={url} alt="" className="rounded-lg w-full" />
    </span>
  );
};
