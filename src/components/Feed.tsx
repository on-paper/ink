"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { StickyNote } from "lucide-react";
import { useCallback, useEffect } from "react";
import { FeedSuspense } from "./FeedSuspense";
import { Button } from "./ui/button";

interface FeedProps<T = any> {
  ItemView: React.ComponentType<{ item: T }>;
  endpoint: string;
  manualNextPage?: boolean;
  queryKey?: string[];
  refetchInterval?: number;
  LoadingView?: React.ComponentType;
  headers?: Record<string, string>;
  emptyStateDescription?: string;
}

interface FeedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export const Feed = <T extends { id: string } = any>({
  ItemView,
  endpoint,
  manualNextPage = false,
  queryKey,
  refetchInterval,
  LoadingView,
  headers,
  emptyStateDescription = "Nothing here but us chickens...",
}: FeedProps<T>) => {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<FeedResponse<T>>({
    queryKey: queryKey || ["feed", endpoint],
    queryFn: async ({ pageParam }) => {
      const hasParams = endpoint.includes("?");
      const paramsMarker = hasParams ? "&" : "?";
      const url = `${endpoint}${paramsMarker}${pageParam ? `cursor=${pageParam}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: headers || {},
      });
      if (!res.ok) throw new Error(res.statusText);

      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: refetchInterval,
  });

  const loadNextBatch = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const viewport = event.target as HTMLElement;
      const threshold = 200; // Reduced threshold for faster loading

      if (
        viewport.scrollTop + viewport.clientHeight + threshold >= viewport.scrollHeight &&
        !isFetchingNextPage &&
        hasNextPage
      ) {
        loadNextBatch();
      }
    };

    if (!manualNextPage) {
      // Try multiple selectors for scroll containers
      const viewport =
        document.querySelector("[data-overlayscrollbars-viewport]") ||
        document.querySelector("[data-radix-scroll-area-viewport]") ||
        document.querySelector(".overflow-y-auto");

      if (viewport) {
        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
      }
    }
  }, [loadNextBatch, manualNextPage, isFetchingNextPage, hasNextPage]);

  if (error) throw error;
  if (isLoading) return LoadingView ? <LoadingView /> : <FeedSuspense />;

  const items = data?.pages.flatMap((page) => page.data) || [];
  const list = items.filter(Boolean).map((item) => <ItemView key={item.id} item={item} />);

  return (
    <div className="flex flex-col gap-2">
      {list}
      {items.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4 relative">
          <StickyNote className="absolute w-32 h-32 text-muted-foreground opacity-10" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Crisp. Clean. Waiting for ink.</h3>
            <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
          </div>
        </div>
      )}
      {manualNextPage && hasNextPage && (
        <Button
          variant="ghost"
          className="w-full mt-4 hover:bg-secondary/70"
          onClick={loadNextBatch}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
      {!manualNextPage && isFetchingNextPage && (
        LoadingView ? <LoadingView /> : <FeedSuspense />
      )}
    </div>
  );
};
