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
  isReplyingToComment?: boolean;
  onSuccess?: (post?: Post | null) => void;
  onCancel?: () => void;
  onContentChange?: (content: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  registerImperativeApi?: (api: {
    saveDraft: () => void;
    discardDraft: () => void;
    getIsDirty: () => boolean;
    confirmClose: () => Promise<boolean>;
  }) => void;
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
