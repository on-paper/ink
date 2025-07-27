import type { Post } from "@cartel-sh/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PostMutationContext {
  previousPost?: Post;
}

export function usePostMutations(postId: string, post?: Post) {
  const queryClient = useQueryClient();

  const updatePostInCache = (updater: (oldPost: Post) => Post, fallbackPost?: Post) => {
    queryClient.setQueryData<Post>(["post", postId], (oldData) => {
      const postToUpdate = oldData || fallbackPost;
      if (!postToUpdate) return oldData;
      return updater(postToUpdate);
    });

    queryClient.setQueriesData<{ pages: { data: Post[] }[] }>({ queryKey: ["posts"], exact: false }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((post) => (post.id === postId ? updater(post) : post)),
        })),
      };
    });

    queryClient.setQueriesData<{ pages: { data: Post[] }[] }>({ queryKey: ["feed"], exact: false }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((post) => (post.id === postId ? updater(post) : post)),
        })),
      };
    });
  };

  const upvoteMutation = useMutation<boolean, Error, void, PostMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to upvote");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      updatePostInCache(
        (old) => ({
          ...old,
          reactions: {
            ...old.reactions,
            upvotes: (old.reactions.upvotes || 0) + (old.reactions.isUpvoted ? -1 : 1),
            isUpvoted: !old.reactions.isUpvoted,
          },
        }),
        post,
      );

      return { previousPost };
    },
    onError: (_, __, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const repostMutation = useMutation<boolean, Error, void, PostMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to repost");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      updatePostInCache(
        (old) => ({
          ...old,
          reactions: {
            ...old.reactions,
            Repost: old.reactions.Repost + (old.reactions.isReposted ? -1 : 1),
            isReposted: !old.reactions.isReposted,
          },
        }),
        post,
      );

      return { previousPost };
    },
    onError: (_, __, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const bookmarkMutation = useMutation<boolean, Error, void, PostMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to bookmark");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      updatePostInCache(
        (old) => ({
          ...old,
          reactions: {
            ...old.reactions,
            isBookmarked: !old.reactions.isBookmarked,
          },
        }),
        post,
      );

      return { previousPost };
    },
    onError: (_, __, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    upvote: upvoteMutation.mutate,
    repost: repostMutation.mutate,
    bookmark: bookmarkMutation.mutate,
    deletePost: deleteMutation.mutate,
    isUpvoting: upvoteMutation.isPending,
    isReposting: repostMutation.isPending,
    isBookmarking: bookmarkMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
