"use client";

import type { Post, User } from "@cartel-sh/ui";
import { createContext, type ReactNode, useContext } from "react";

interface ComposerContextValue {
  user?: User;
  replyingTo?: Post;
  quotedPost?: Post;
  editingPost?: Post;
  initialContent?: string;
  community?: string;
  feed?: string;
  isReplyingToComment?: boolean;
  onSuccess?: (post?: Post | null) => void;
  onCancel?: () => void;
}

const ComposerContext = createContext<ComposerContextValue | undefined>(undefined);

export const ComposerProvider = ({ children, value }: { children: ReactNode; value: ComposerContextValue }) => {
  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
};

export const useComposer = () => {
  const context = useContext(ComposerContext);
  if (!context) {
    throw new Error("useComposer must be used within a ComposerProvider");
  }
  return context;
};
