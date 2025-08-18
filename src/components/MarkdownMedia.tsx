import { ImageViewer } from "./ImageViewer";
import { VideoPlayer } from "./VideoPlayer";

// Extract consecutive media (images/videos) from markdown content
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

  // Regex to match markdown images/media
  const mediaRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line is markdown media
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

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide my-2" style={{ height: "300px" }}>
      <div className="flex gap-2 h-full items-center" style={{ width: "max-content" }}>
        {urls.map((url, index) => {
          const mimeType = mimeTypes?.[url];
          const isVideo = mimeType?.startsWith("video/") || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|m4v)(\?|$)/);

          return (
            <div key={`gallery-media-${url}`} className="h-full flex items-center">
              {isVideo ? (
                <div className="h-full flex items-center" style={{ height: "300px" }}>
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
  );
};

export const MarkdownMediaItem = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const isVideo = mimeType?.startsWith("video/");

  if (isVideo) {
    return (
      <div className="my-2" style={{ maxHeight: "min(100%, 300px)" }}>
        <VideoPlayer url={url} preview="" autoplay={true} />
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <ImageViewer src={url} alt="" className="rounded-lg w-full" />
    </div>
  );
};
