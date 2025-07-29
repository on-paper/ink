import type { Post } from "@cartel-sh/ui";
import { useInfiniteQuery } from "@tanstack/react-query";

interface FeedResponse {
  data: Post[];
  nextCursor?: string;
}

export function useFeed(endpoint: string, params?: Record<string, string>) {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";

  return useInfiniteQuery({
    queryKey: ["posts", endpoint, params],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `&cursor=${pageParam}` : "";
      const response = await fetch(`${endpoint}${queryString}${cursor}`);

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const data: FeedResponse = await response.json();
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Specific feed hooks
export function useHomeFeed() {
  return useFeed("/api/posts/feed");
}

export function useUserPosts(userId: string) {
  return useFeed(`/api/posts/user/${userId}`);
}

export function usePostComments(postId: string) {
  return useFeed(`/api/posts/${postId}/comments`);
}

export function useBookmarks() {
  return useFeed("/api/bookmarks");
}
