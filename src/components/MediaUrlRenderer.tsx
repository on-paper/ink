import React from "react";
import { useUrlDetection } from "~/hooks/useImageUrlDetection";
import { ImageViewer } from "./ImageViewer";

interface MediaUrlRendererProps {
  url: string;
  colorClasses: string;
}

export const MediaUrlRenderer: React.FC<MediaUrlRendererProps> = ({
  url,
  colorClasses,
}) => {
  const { isImage, isVideo, isAudio, isLoading, mimeType, error } =
    useUrlDetection(url);

  if (isLoading) {
    return (
      <span className={`lexical-link ${colorClasses}`}>
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        {url}
      </span>
    );
  }

  if (error) {
    // If there's an error detecting the media type, render as a regular link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`lexical-link ${colorClasses}`}
      >
        {url}
      </a>
    );
  }

  if (isImage) {
    return (
      <div className="my-2">
        <ImageViewer src={url} alt="" className="rounded-lg w-full max-w-md" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="my-2">
        <video
          controls
          className="w-full max-w-md rounded-lg"
          preload="metadata"
        >
          <source src={url} type={mimeType || undefined} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`lexical-link ${colorClasses}`}
          >
            {url}
          </a>
        </video>
      </div>
    );
  }

  if (isAudio) {
    // For audio, render a simple audio element since AudioPlayer requires many props
    return (
      <div className="my-2">
        <audio controls className="w-full max-w-md" preload="metadata">
          <source src={url} type={mimeType || undefined} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`lexical-link ${colorClasses}`}
          >
            {url}
          </a>
        </audio>
      </div>
    );
  }

  // If not a recognized media type, render as regular link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`lexical-link ${colorClasses}`}
    >
      {url}
    </a>
  );
};

// Keep the old component for backward compatibility
export const ImageUrlRenderer: React.FC<MediaUrlRendererProps> =
  MediaUrlRenderer;
