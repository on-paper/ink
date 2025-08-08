"use client";

import { atom } from "jotai";

export type ActiveComposerDraft = {
  isActive: boolean;
  isModal: boolean;
  draftId: string | null;
  content: string;
  updatedAt: number | null;
  hasMedia: boolean;
};

export const composerDraftAtom = atom<ActiveComposerDraft>({
  isActive: false,
  isModal: false,
  draftId: null,
  content: "",
  updatedAt: null,
  hasMedia: false,
});