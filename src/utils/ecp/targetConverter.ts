/**
 * Convert a post ID to an ECP target identifier
 * ECP uses URL-like identifiers for comment targets
 */
export function postIdToEcpTarget(postId: string): string {
  // For now, we'll use the Paper post URL as the target
  // This creates a unique identifier for each post
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://paper.ink";
  return `${baseUrl}/p/${postId}`;
}

/**
 * Extract post ID from an ECP target
 */
export function ecpTargetToPostId(target: string): string | null {
  const match = target.match(/\/p\/(.+)$/);
  return match ? match[1] : null;
}
