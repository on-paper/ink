export async function detectMimeType(url: string): Promise<string | null> {
  if (url.includes("ipfs.io") || url.includes("grove.storage") || url.includes("arweave.net")) {
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

  return null;
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
