import type { Post } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";

const fetchPost = async (postId: string): Promise<Post> => {
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch post");
  }
  const data = await response.json();
  return data.data;
};

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId!),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
