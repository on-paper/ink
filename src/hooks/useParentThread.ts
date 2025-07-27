import type { Post } from "@cartel-sh/ui";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";

async function fetchPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();

    // Handle both possible response formats
    const post = data.nativePost || data.data || data;

    // Validate the post has required fields
    if (!post || typeof post !== "object" || !post.id) {
      console.error("Invalid post data received:", post);
      return null;
    }

    return post as Post;
  } catch (error) {
    console.error("Failed to fetch post", error);
    return null;
  }
}

export function useParentThread(post: Post) {
  const [parentIds, setParentIds] = useState<string[]>([]);

  // Build the chain of parent IDs
  useEffect(() => {
    const ids: string[] = [];
    let current: Post | undefined = post;

    // Collect all parent IDs up the chain
    while (current) {
      const parentId = current.commentOn?.id ?? current.quoteOn?.id;
      if (parentId) {
        ids.push(parentId);
        // We need to wait for the fetch to get the next parent
        // This will be handled by the queries below
        break;
      }
      current = undefined;
    }

    setParentIds(ids);
  }, [post]);

  // Fetch all parents using parallel queries
  const queries = useQueries({
    queries: parentIds.map((id) => ({
      queryKey: ["post", id],
      queryFn: () => fetchPost(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    })),
  });

  // Check if we need to fetch more parents
  useEffect(() => {
    const lastQuery = queries[queries.length - 1];
    if (lastQuery?.data) {
      const parentId = lastQuery.data.commentOn?.id ?? lastQuery.data.quoteOn?.id;
      if (parentId && !parentIds.includes(parentId)) {
        setParentIds((prev) => [...prev, parentId]);
      }
    }
  }, [queries, parentIds]);

  const loading = queries.some((q) => q.isLoading);
  const parentThread = queries
    .map((q) => q.data)
    .filter((p): p is Post => p !== null && p !== undefined && typeof p === "object" && "id" in p)
    .reverse(); // Reverse to show oldest parent first

  return { parentThread, loading };
}
