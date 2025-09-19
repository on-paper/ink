"use client";

import { useAtomValue } from "jotai";
import { bookmarksAtom } from "~/atoms/bookmarks";
import { Feed } from "./Feed";
import { PostView } from "./post/PostView";


export const BookmarksFeed = () => {
  const bookmarkedIds = useAtomValue(bookmarksAtom);

  return (
    <Feed
      ItemView={PostView}
      endpoint="/api/bookmarks"
      queryKey={["bookmarks", ...bookmarkedIds]}
      headers={{
        "x-bookmarked-ids": bookmarkedIds.join(","),
      }}
      emptyStateTitle="No saved posts yet"
      emptyStateDescription="Save a post to keep it handy for later."
    />
  );
};
