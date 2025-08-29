export async function detectMimeType(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    const contentType = response.headers.get("content-type");
    return contentType;
  } catch (error) {
    console.warn(`Failed to detect MIME type for ${url}:`, error);
    return null;
  }
}

// Keep this function for backward compatibility, but it now always returns true
// since we want to test every URL
export function isLikelyImageUrl(_url: string): boolean {
  return true;
}

export function isImageMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

export function isVideoMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("video/") || mimeType === "application/x-mpegURL";
}

export function isAudioMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("audio/");
}
