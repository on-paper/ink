import type { Post } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { bookmarksAtom } from "~/atoms/bookmarks";

interface BookmarksResponse {
  data: any[];
  pagination?: {
    hasMore: boolean;
    cursor: string | null;
  };
}

export function useBookmarkedPosts() {
  const bookmarkedIds = useAtomValue(bookmarksAtom);

  return useQuery<Post[]>({
    queryKey: ["bookmarks", bookmarkedIds],
    queryFn: async () => {
      if (bookmarkedIds.length === 0) {
        return [];
      }

      const response = await fetch("/api/bookmarks", {
        headers: {
          Accept: "application/json",
          "x-bookmarked-ids": bookmarkedIds.join(","),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch bookmarked posts: ${response.status}`);
      }

      const data: BookmarksResponse = await response.json();

      return data.data || [];
    },
    enabled: true,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
