import { useEffect, useState } from "react";
import {
  detectMimeType,
  isAudioMimeType,
  isImageMimeType,
  isVideoMimeType,
} from "~/utils/media/detectMediaType";

interface UrlDetectionResult {
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isLoading: boolean;
  mimeType: string | null;
  error: string | null;
}

export function useUrlDetection(url: string): UrlDetectionResult {
  const [result, setResult] = useState<UrlDetectionResult>({
    isImage: false,
    isVideo: false,
    isAudio: false,
    isLoading: false,
    mimeType: null,
    error: null,
  });

  useEffect(() => {
    if (!url) {
      setResult({
        isImage: false,
        isVideo: false,
        isAudio: false,
        isLoading: false,
        mimeType: null,
        error: null,
      });
      return;
    }

    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    detectMimeType(url)
      .then((mimeType) => {
        const isImage = isImageMimeType(mimeType);
        const isVideo = isVideoMimeType(mimeType);
        const isAudio = isAudioMimeType(mimeType);

        setResult({
          isImage,
          isVideo,
          isAudio,
          isLoading: false,
          mimeType,
          error: null,
        });
      })
      .catch((error) => {
        setResult({
          isImage: false,
          isVideo: false,
          isAudio: false,
          isLoading: false,
          mimeType: null,
          error: error.message || "Failed to detect media type",
        });
      });
  }, [url]);

  return result;
}

// Keep the old hook for backward compatibility
export function useImageUrlDetection(url: string) {
  const result = useUrlDetection(url);
  return {
    isImage: result.isImage,
    isLoading: result.isLoading,
    mimeType: result.mimeType,
  };
}
