import type { User } from "@cartel-sh/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UserMutationContext {
  previousUser?: User;
}

export function useUserMutations(userId: string) {
  const queryClient = useQueryClient();

  const updateUserInCache = (updater: (oldUser: User) => User) => {
    queryClient.setQueryData<User>(["user", userId], (oldData) => {
      if (!oldData) return oldData;
      return updater(oldData);
    });

    queryClient.setQueriesData<{ pages: { data: User[] }[] }>({ queryKey: ["users"], exact: false }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((user) => (user.id === userId ? updater(user) : user)),
        })),
      };
    });
  };

  const followMutation = useMutation<boolean, Error, void, UserMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/follow`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to follow user");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      const previousUser = queryClient.getQueryData<User>(["user", userId]);

      // Optimistic update
      updateUserInCache((old) => ({
        ...old,
        actions: {
          ...old.actions,
          followed: !old.actions?.followed,
        },
      }));

      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", userId], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate follow lists
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });

  const muteMutation = useMutation<boolean, Error, void, UserMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/mute`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mute user");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      const previousUser = queryClient.getQueryData<User>(["user", userId]);

      // Optimistic update
      updateUserInCache((old) => ({
        ...old,
        actions: {
          ...old.actions,
          muted: true,
        },
      }));

      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", userId], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const unmuteMutation = useMutation<boolean, Error, void, UserMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/unmute`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to unmute user");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      const previousUser = queryClient.getQueryData<User>(["user", userId]);

      // Optimistic update
      updateUserInCache((old) => ({
        ...old,
        actions: {
          ...old.actions,
          muted: false,
        },
      }));

      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", userId], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const blockMutation = useMutation<boolean, Error, void, UserMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/block`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to block user");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      const previousUser = queryClient.getQueryData<User>(["user", userId]);

      // Optimistic update
      updateUserInCache((old) => ({
        ...old,
        actions: {
          ...old.actions,
          blocked: true,
        },
      }));

      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", userId], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const unblockMutation = useMutation<boolean, Error, void, UserMutationContext>({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/unblock`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to unblock user");
      const result = await response.json();
      return result.result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      const previousUser = queryClient.getQueryData<User>(["user", userId]);

      // Optimistic update
      updateUserInCache((old) => ({
        ...old,
        actions: {
          ...old.actions,
          blocked: false,
        },
      }));

      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", userId], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  return {
    follow: followMutation.mutateAsync,
    mute: muteMutation.mutateAsync,
    unmute: unmuteMutation.mutateAsync,
    block: blockMutation.mutateAsync,
    unblock: unblockMutation.mutateAsync,
    isFollowing: followMutation.isPending,
    isMuting: muteMutation.isPending,
    isUnmuting: unmuteMutation.isPending,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
  };
}
