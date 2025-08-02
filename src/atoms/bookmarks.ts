import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const bookmarksAtom = atomWithStorage<string[]>("paper-bookmarks", []);

export const bookmarksSetAtom = atom((get) => new Set(get(bookmarksAtom)));

export const isBookmarkedAtom = atom((get) => (postId: string) => {
  const bookmarksSet = get(bookmarksSetAtom);
  return bookmarksSet.has(postId);
});

export const toggleBookmarkAtom = atom(null, (get, set, postId: string) => {
  const currentBookmarks = get(bookmarksAtom);
  const bookmarksSet = new Set(currentBookmarks);

  const wasBookmarked = bookmarksSet.has(postId);

  if (wasBookmarked) {
    bookmarksSet.delete(postId);
  } else {
    bookmarksSet.add(postId);
  }

  set(bookmarksAtom, Array.from(bookmarksSet));

  // Return the new bookmark status (true if now bookmarked, false if removed)
  return !wasBookmarked;
});

export const addBookmarkAtom = atom(null, (get, set, postId: string) => {
  const currentBookmarks = get(bookmarksAtom);
  if (!currentBookmarks.includes(postId)) {
    set(bookmarksAtom, [...currentBookmarks, postId]);
  }
});

export const removeBookmarkAtom = atom(null, (get, set, postId: string) => {
  const currentBookmarks = get(bookmarksAtom);
  set(
    bookmarksAtom,
    currentBookmarks.filter((id) => id !== postId),
  );
});
