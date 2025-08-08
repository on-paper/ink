"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Draft = {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "paper.drafts.v1";

export const draftsAtom = atomWithStorage<Draft[]>(STORAGE_KEY, []);

export const upsertDraftAtom = atom(null, (get, set, payload: { id: string; content: string }) => {
  const now = Date.now();
  const drafts = get(draftsAtom);
  const index = drafts.findIndex((d) => d.id === payload.id);
  let next: Draft[];
  if (index >= 0) {
    const updated: Draft = { ...drafts[index], content: payload.content, updatedAt: now };
    next = [...drafts];
    next[index] = updated;
  } else {
    const created: Draft = { id: payload.id, content: payload.content, createdAt: now, updatedAt: now };
    next = [created, ...drafts];
  }
  next = next.filter((d) => d.content.trim().length > 0);
  set(draftsAtom, next);
});

export const deleteDraftAtom = atom(null, (get, set, id: string) => {
  const drafts = get(draftsAtom);
  set(draftsAtom, drafts.filter((d) => d.id !== id));
});