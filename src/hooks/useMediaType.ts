import { useEffect, useState } from "react";

export type MediaType = "image" | "video" | "audio" | "unknown";

const mediaTypeCache = new Map<string, MediaType>();

const getMediaTypeFromContentType = (contentType: string): MediaType => {
  const type = contentType.toLowerCase();

  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }

  if (type.includes("mp4") || type.includes("webm") || type.includes("ogg")) {
    return "video";
  }
  if (type.includes("jpeg") || type.includes("jpg") || type.includes("png") || type.includes("gif")) {
    return "image";
  }
  if (type.includes("mp3") || type.includes("wav") || type.includes("flac")) {
    return "audio";
  }

  return "unknown";
};

export const detectMediaType = async (url: string): Promise<MediaType> => {
  // Check cache first
  if (mediaTypeCache.has(url)) {
    return mediaTypeCache.get(url)!;
  }

  try {
    // Try HEAD request first (more efficient)
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      credentials: "omit",
    });

    const contentType = response.headers.get("content-type");
    if (contentType) {
      const mediaType = getMediaTypeFromContentType(contentType);
      mediaTypeCache.set(url, mediaType);
      return mediaType;
    }
  } catch (error) {
    // If HEAD fails, try a small range request
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        headers: {
          Range: "bytes=0-0", // Request only first byte
        },
      });

      const contentType = response.headers.get("content-type");
      if (contentType) {
        const mediaType = getMediaTypeFromContentType(contentType);
        mediaTypeCache.set(url, mediaType);
        return mediaType;
      }
    } catch {
      // If both fail, default to image (most common case)
      console.warn(`Failed to detect media type for ${url}, defaulting to image`);
    }
  }

  // Default to image if we can't determine
  const defaultType: MediaType = "image";
  mediaTypeCache.set(url, defaultType);
  return defaultType;
};

export const useMediaType = (url: string): { type: MediaType; loading: boolean } => {
  const [type, setType] = useState<MediaType>(() => {
    return mediaTypeCache.get(url) || "unknown";
  });
  const [loading, setLoading] = useState(() => !mediaTypeCache.has(url));

  useEffect(() => {
    if (mediaTypeCache.has(url)) {
      setType(mediaTypeCache.get(url)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    detectMediaType(url).then((detectedType) => {
      if (!cancelled) {
        setType(detectedType);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { type, loading };
};

export const useMediaTypes = (urls: string[]): { types: Map<string, MediaType>; loading: boolean } => {
  const [types, setTypes] = useState<Map<string, MediaType>>(() => {
    const initial = new Map<string, MediaType>();
    for (const url of urls) {
      const cached = mediaTypeCache.get(url);
      if (cached) {
        initial.set(url, cached);
      }
    }
    return initial;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const detectAll = async () => {
      const newTypes = new Map<string, MediaType>();
      const promises: Promise<void>[] = [];

      for (const url of urls) {
        promises.push(
          detectMediaType(url).then((type) => {
            if (!cancelled) {
              newTypes.set(url, type);
            }
          }),
        );
      }

      await Promise.all(promises);

      if (!cancelled) {
        setTypes(newTypes);
        setLoading(false);
      }
    };

    detectAll();

    return () => {
      cancelled = true;
    };
  }, [urls.join(",")]);

  return { types, loading };
};
