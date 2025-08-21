"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { FeedSuspense } from "./FeedSuspense";
import { LoadingSpinner } from "./LoadingSpinner";
import { Button } from "./ui/button";

interface FeedProps<T = any> {
  ItemView: React.ComponentType<{ item: T }>;
  endpoint: string;
  manualNextPage?: boolean;
  queryKey?: string[];
  refetchInterval?: number;
  LoadingView?: React.ComponentType;
  headers?: Record<string, string>;
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

      if (viewport.scrollTop + viewport.clientHeight + threshold >= viewport.scrollHeight && !isFetchingNextPage && hasNextPage) {
        loadNextBatch();
      }
    };

    if (!manualNextPage) {
      // Try multiple selectors for scroll containers
      const viewport = document.querySelector("[data-overlayscrollbars-viewport]") || 
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
        <div className="w-full h-12 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
