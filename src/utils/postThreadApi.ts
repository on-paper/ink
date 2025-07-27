import type { Post } from "@cartel-sh/ui";

export async function fetchParentPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) throw new Error(res.statusText);
    const { nativePost } = await res.json();
    return nativePost as Post;
  } catch (error) {
    console.error("Failed to fetch parent post", error);
    return null;
  }
}

export async function fetchAuthorComments(postId: string, authorId: string): Promise<Post[]> {
  try {
    const res = await fetch(`/api/posts/${postId}/comments?author=${authorId}`);
    if (!res.ok) throw new Error(res.statusText);
    const { comments } = await res.json();
    return comments as Post[];
  } catch (error) {
    console.error("Failed to fetch comments", error);
    return [];
  }
}
