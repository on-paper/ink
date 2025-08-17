import { type MediaType, useMediaType, useMediaTypes } from "~/hooks/useMediaType";
import { ImageViewer } from "./ImageViewer";
import { VideoPlayer } from "./VideoPlayer";

export type MediaItem = {
  url: string;
  type?: MediaType; // Type will be detected asynchronously
};

export const extractConsecutiveMedia = (content: string): { mediaGroups: string[][]; processedContent: string } => {
  const lines = content.split("\n");
  const mediaGroups: string[][] = [];
  let currentGroup: string[] = [];
  const processedLines: string[] = [];

  // Regex to match markdown images
  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line is a markdown image
    if (trimmedLine.match(imageRegex)) {
      const match = trimmedLine.match(imageRegex);
      if (match) {
        const url = match[2];
        currentGroup.push(url);
      }

      // Look ahead to see if next lines are also media
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine === "") {
          // Empty line, could be separator between media items
          j++;
        } else if (nextLine.match(imageRegex)) {
          // Another media item
          const nextMatch = nextLine.match(imageRegex);
          if (nextMatch) {
            const url = nextMatch[2];
            currentGroup.push(url);
          }
          i = j; // Skip this line in the main loop
          j++;
        } else {
          // Not a media item, stop collecting
          break;
        }
      }

      // Now we have collected all consecutive media
      if (currentGroup.length > 1) {
        // Multiple media items, create a gallery
        mediaGroups.push([...currentGroup]);
        // Use a placeholder that we'll detect and replace
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== "") {
          processedLines.push("");
        }
        processedLines.push(`MEDIA_GALLERY_PLACEHOLDER_${mediaGroups.length - 1}`);
        processedLines.push("");
      } else if (currentGroup.length === 1) {
        // Single media item, keep as-is
        processedLines.push(line);
      }

      currentGroup = [];
      i = j - 1; // Continue from where we stopped
    } else {
      // Regular line, not a media item
      processedLines.push(line);
    }
  }

  return { mediaGroups, processedContent: processedLines.join("\n") };
};

// Gallery component for markdown media (images and videos)
export const MarkdownMediaGallery = ({ urls }: { urls: string[] }) => {
  const { types, loading } = useMediaTypes(urls);

  // Convert to gallery items format with detected types
  const galleryItems = urls.map((url) => ({
    item: url,
    type: types.get(url) || "image", // Default to image if type not yet detected
  }));

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide my-2" style={{ height: "300px" }}>
      <div className="flex gap-2 h-full items-center" style={{ width: "max-content" }}>
        {urls.map((url, index) => {
          const mediaType = types.get(url) || "image";

          // Show loading state while detecting type
          if (loading && !types.has(url)) {
            return (
              <div key={`gallery-media-${url}`} className="h-full flex items-center">
                <div className="h-full w-[200px] bg-muted animate-pulse rounded-xl" />
              </div>
            );
          }

          return (
            <div key={`gallery-media-${url}`} className="h-full flex items-center">
              {mediaType === "image" ? (
                <ImageViewer
                  src={url}
                  alt={`Gallery media ${index + 1}`}
                  className="h-full max-h-[300px] w-auto object-contain border rounded-xl cursor-pointer"
                  galleryItems={galleryItems}
                  currentIndex={index}
                />
              ) : mediaType === "video" ? (
                <div className="h-full flex items-center" style={{ height: "300px" }}>
                  <VideoPlayer
                    url={url}
                    preview=""
                    galleryItems={galleryItems}
                    currentIndex={index}
                    autoplay={index === 0} // Only autoplay first video
                    useModal={true}
                  />
                </div>
              ) : (
                // For audio or unknown types, show a placeholder
                <div className="h-full flex items-center">
                  <div className="h-full w-[200px] bg-muted rounded-xl flex items-center justify-center">
                    <span className="text-muted-foreground">Unsupported media</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MarkdownMediaItem = ({ url }: { url: string }) => {
  const { type, loading } = useMediaType(url);

  if (loading) {
    return (
      <div className="max-w-md my-2">
        <div className="aspect-video bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="my-2" style={{ maxHeight: "min(100%, 300px)" }}>
        <VideoPlayer url={url} preview="" autoplay={true} />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="my-2">
        <audio controls className="w-full">
          <source src={url} />
        </audio>
      </div>
    );
  }

  // Default to image
  return (
    <div className="max-w-md">
      <ImageViewer src={url} alt="" className="rounded-lg w-full" />
    </div>
  );
};
