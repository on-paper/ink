"use client";

import type { Post } from "@cartel-sh/ui";
import { createContext, type PropsWithChildren, useContext } from "react";
import { usePostState } from "~/hooks/usePostState";

type PostStateContextType = ReturnType<typeof usePostState> | null;

export const PostStateContext = createContext<PostStateContextType>(null);

export const PostStateProvider = ({
  children,
  post,
  onReply,
  onMenuAction,
  onEditToggle,
}: PropsWithChildren<{
  post: Post;
  onReply?: () => void;
  onMenuAction?: () => void;
  onEditToggle?: (isEditing: boolean) => void;
}>) => {
  const postState = usePostState(post, onReply, onMenuAction, onEditToggle);

  return (
    <PostStateContext.Provider value={postState}>
      {children}
      {postState.DeleteDialog && <postState.DeleteDialog />}
    </PostStateContext.Provider>
  );
};

export const usePostStateContext = () => {
  const context = useContext(PostStateContext);
  if (!context) {
    throw new Error("usePostStateContext must be used within a PostStateProvider");
  }
  return context;
};

// Hook that tries to use context first, falls back to creating new state
export const usePostStateWithFallback = (
  post: Post,
  onReply?: () => void,
  onMenuAction?: () => void,
  onEditToggle?: (isEditing: boolean) => void,
) => {
  const context = useContext(PostStateContext);
  const fallbackState = usePostState(post, onReply, onMenuAction, onEditToggle);

  const state = context || fallbackState;

  return state;
};
