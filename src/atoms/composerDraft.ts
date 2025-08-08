"use client";

import { atomWithStorage } from "jotai/utils";

export type ActiveComposerDraft = {
  isActive: boolean;
  isModal: boolean;
  draftId: string | null;
  content: string;
  updatedAt: number | null;
  hasMedia: boolean;
};

const defaultState: ActiveComposerDraft = {
  isActive: false,
  isModal: false,
  draftId: null,
  content: "",
  updatedAt: null,
  hasMedia: false,
};

export const composerDraftAtom = atomWithStorage<ActiveComposerDraft>("paper.activeComposer.v1", defaultState);