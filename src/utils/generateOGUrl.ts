export function generatePostOGUrl(params: {
  handle: string;
  content: string;
  profilePictureUrl?: string;
  image?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const searchParams = new URLSearchParams();

  searchParams.append("handle", params.handle);
  searchParams.append("content", params.content);
  if (params.profilePictureUrl) {
    searchParams.append("profilePictureUrl", params.profilePictureUrl);
  }
  if (params.image) {
    searchParams.append("image", params.image);
  }

  return `${baseUrl}/api/og/post?${searchParams.toString()}`;
}

export function generateUserOGUrl(params: { username: string; profilePictureUrl?: string }): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const searchParams = new URLSearchParams();

  searchParams.append("username", params.username);
  if (params.profilePictureUrl) {
    searchParams.append("profilePictureUrl", params.profilePictureUrl);
  }

  return `${baseUrl}/api/og/user?${searchParams.toString()}`;
}

export function generateDefaultOGUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${baseUrl}/api/og/default`;
}
