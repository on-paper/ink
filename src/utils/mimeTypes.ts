// Normalize video MIME types to standard format
export function normalizeVideoMimeType(type: string | undefined): string | undefined {
  if (!type) return undefined;

  // Handle uppercase format conversions
  const upperType = type.toUpperCase();

  // Handle cases like 'VIDEO_MP_4' -> 'video/mp4'
  if (upperType === "VIDEO_MP_4" || upperType === "VIDEO_MP4" || upperType === "MP4") return "video/mp4";
  if (upperType === "VIDEO_MOV" || upperType === "MOV" || upperType === "QUICKTIME") return "video/quicktime";
  if (upperType === "VIDEO_WEBM" || upperType === "WEBM") return "video/webm";
  if (upperType === "VIDEO_OGG" || upperType === "OGG" || upperType === "OGV") return "video/ogg";
  if (upperType === "VIDEO_AVI" || upperType === "AVI") return "video/x-msvideo";
  if (upperType === "VIDEO_MPEG" || upperType === "MPEG" || upperType === "MPG") return "video/mpeg";
  if (upperType === "VIDEO_3GPP" || upperType === "3GP") return "video/3gpp";
  if (upperType === "VIDEO_MKV" || upperType === "MKV") return "video/x-matroska";
  if (upperType === "VIDEO_M4V" || upperType === "M4V") return "video/x-m4v";
  if (upperType === "VIDEO_OGV" || upperType === "OGV") return "video/ogv";
  if (upperType === "MODEL_GLTF" || upperType === "GLTF") return "model/gltf+json";
  if (upperType === "MODEL_GLTF_BINARY" || upperType === "GLTF_BINARY") return "model/gltf-binary";

  // If it's already a valid MIME type, return as is
  if (type.startsWith("video/") || type.startsWith("model/")) return type;

  // Try to convert other formats
  const normalized = type.toLowerCase().replace("video_", "video/").replace("model_", "model/").replace("_", "-");
  return normalized.startsWith("video/") || normalized.startsWith("model/") ? normalized : undefined;
}

// Normalize image MIME types to standard format
export function normalizeImageMimeType(type: string | undefined): string | undefined {
  if (!type) return undefined;

  // Handle uppercase format conversions
  const upperType = type.toUpperCase();

  // Handle cases like 'IMAGE_JPEG' -> 'image/jpeg'
  if (upperType === "IMAGE_JPEG" || upperType === "IMAGE_JPG" || upperType === "JPEG" || upperType === "JPG")
    return "image/jpeg";
  if (upperType === "IMAGE_PNG" || upperType === "PNG") return "image/png";
  if (upperType === "IMAGE_GIF" || upperType === "GIF") return "image/gif";
  if (upperType === "IMAGE_WEBP" || upperType === "WEBP") return "image/webp";
  if (upperType === "IMAGE_BMP" || upperType === "BMP") return "image/bmp";
  if (upperType === "IMAGE_SVG" || upperType === "SVG" || upperType === "SVG_XML") return "image/svg+xml";
  if (upperType === "IMAGE_TIFF" || upperType === "TIFF" || upperType === "TIF") return "image/tiff";
  if (upperType === "IMAGE_AVIF" || upperType === "AVIF") return "image/avif";
  if (upperType === "IMAGE_HEIC" || upperType === "HEIC") return "image/heic";
  if (upperType === "IMAGE_X_MS_BMP" || upperType === "X-MS-BMP" || upperType === "X_MS_BMP") return "image/x-ms-bmp";

  // If it's already a valid MIME type, return as is
  if (type.startsWith("image/")) return type;

  // Try to convert other formats
  const normalized = type.toLowerCase().replace("image_", "image/").replace("_", "-");
  return normalized.startsWith("image/") ? normalized : undefined;
}

// Normalize any MIME type (image or video)
export function normalizeMimeType(type: string | undefined): string | undefined {
  if (!type) return undefined;

  // Try image normalization first
  const imageType = normalizeImageMimeType(type);
  if (imageType) return imageType;

  // Try video normalization
  const videoType = normalizeVideoMimeType(type);
  if (videoType) return videoType;

  // Return original if no normalization worked
  return type;
}

// Check if a MIME type is an image type
export function isImageMimeType(type: string | undefined): boolean {
  if (!type) return false;
  const normalized = normalizeMimeType(type);
  return normalized?.startsWith("image/") || false;
}

// Check if a MIME type is a video type
export function isVideoMimeType(type: string | undefined): boolean {
  if (!type) return false;
  const normalized = normalizeMimeType(type);
  return normalized?.startsWith("video/") || normalized?.startsWith("model/") || false;
}

// Cast normalized type to media type
export function castToMediaImageType(type: string): string {
  return normalizeImageMimeType(type) || type;
}

export function castToMediaVideoType(type: string): string {
  return normalizeVideoMimeType(type) || type;
}
