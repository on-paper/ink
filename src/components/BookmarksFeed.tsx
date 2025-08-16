"use client";

import { useAtomValue } from "jotai";
import { bookmarksAtom } from "~/atoms/bookmarks";
import { Feed } from "./Feed";
import { PostView } from "./post/PostView";

export const BookmarksFeed = () => {
  const bookmarkedIds = useAtomValue(bookmarksAtom);

  const endpoint = "/api/bookmarks";

  if (bookmarkedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">No bookmarks yet</p>
        <p className="text-sm text-muted-foreground mt-2">Save posts to view them here later</p>
      </div>
    );
  }

  return (
    <Feed
      ItemView={PostView}
      endpoint={endpoint}
      queryKey={["bookmarks", ...bookmarkedIds]}
      headers={{
        "x-bookmarked-ids": bookmarkedIds.join(","),
      }}
    />
  );
};
