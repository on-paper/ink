import type { Post } from "@cartel-sh/ui";
import { useEffect, useState } from "react";
import { fetchAuthorComments } from "~/utils/postThreadApi";

export function useAuthorThread(post: Post) {
  const [authorThread, setAuthorThread] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const processedIds = new Set<string>();
    const allAuthorPosts: Post[] = [];

    async function loadAuthorReplies(currentPost: Post, authorId: string): Promise<void> {
      if (!currentPost || cancelled || processedIds.has(currentPost.id)) {
        return;
      }
      processedIds.add(currentPost.id);

      const authorComments = await fetchAuthorComments(currentPost.id, authorId);

      for (const comment of authorComments) {
        if (cancelled) break;

        if (!allAuthorPosts.some((p) => p.id === comment.id)) {
          allAuthorPosts.push(comment);
        }

        await loadAuthorReplies(comment, authorId);
      }
    }

    async function loadAllPosts() {
      await loadAuthorReplies(post, post.author.address);

      if (!cancelled) {
        // Sort all collected posts by date and update state
        const sortedPosts = allAuthorPosts.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setAuthorThread(sortedPosts);
        setLoading(false);
      }
    }

    loadAllPosts();

    return () => {
      cancelled = true;
    };
  }, [post.id, post.author.address]);

  return { authorThread, loading };
}
