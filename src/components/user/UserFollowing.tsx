"use client";

import { type User } from "@cartel-sh/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber } from "~/utils/formatNumber";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { UserView } from "./UserView";

interface UserFollowingProps {
  user: User;
  followingCount: number;
  followersCount: number;
}

interface FeedResponse<T> {
  data: T[];
  nextCursor?: string;
}

const UserList = ({ endpoint }: { endpoint: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<
    FeedResponse<User>
  >({
    queryKey: ["user-list", endpoint],
    queryFn: async ({ pageParam }) => {
      const hasParams = endpoint.includes("?");
      const paramsMarker = hasParams ? "&" : "?";
      const url = `${endpoint}${paramsMarker}${pageParam ? `cursor=${pageParam}` : ""}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const loadNextBatch = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const checkAndLoadMore = () => {
      if (containerRef.current) {
        const scrollViewport = containerRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (scrollViewport) {
          const hasScroll = scrollViewport.scrollHeight > scrollViewport.clientHeight;
          if (!hasScroll && hasNextPage && !isFetchingNextPage) {
            loadNextBatch();
          }
        }
      }
    };

    const timer = setTimeout(checkAndLoadMore, 200);
    return () => clearTimeout(timer);
  }, [data, hasNextPage, isFetchingNextPage, loadNextBatch]);

  // Handle scroll for loading more
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const threshold = 100;

      if (
        target.scrollTop + target.clientHeight + threshold >= target.scrollHeight &&
        !isFetchingNextPage &&
        hasNextPage
      ) {
        loadNextBatch();
      }
    };

    if (containerRef.current) {
      const scrollViewport = containerRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollViewport) {
        scrollViewport.addEventListener("scroll", handleScroll);
        return () => scrollViewport.removeEventListener("scroll", handleScroll);
      }
    }
  }, [loadNextBatch, isFetchingNextPage, hasNextPage, data]);

  if (error) throw error;

  if (isLoading) {
    return (
      <ScrollArea className="h-[500px] w-full">
        <div className="flex flex-col gap-2 pr-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-4 w-48 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  const items = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div ref={containerRef}>
      <ScrollArea className="h-[500px] w-full">
        <div className="flex flex-col gap-2 p-2 pr-4">
          {items.filter(Boolean).map((item) => (
            <UserView key={item.id} item={item} />
          ))}
          {isFetchingNextPage && (
            <div className="animate-pulse">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="h-4 w-48 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const UserFollowing = ({ user, followingCount, followersCount }: UserFollowingProps) => {
  const [activeView, setActiveView] = useState<"followers" | "following">("followers");

  return (
    <Dialog>
      <DialogTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {formatNumber(followersCount)} {followersCount === 1 ? "follower" : "followers"}
      </DialogTrigger>
      <DialogContent className="max-w-lg backdrop-blur-md gap-0 bg-card/60 p-0">
        <div className="flex gap-0">
          <Button
            variant={"secondary"}
            onClick={() => setActiveView("followers")}
            className={`${activeView === "followers" ? "bg-transparent" : ""} flex-1 rounded-b-none rounded-r-none hover:scale-1 active:scale-1 h-12 hover:bg-muted/50`}
          >
            {formatNumber(followersCount)} Followers
          </Button>
          <Button
            variant={"secondary"}
            onClick={() => setActiveView("following")}
            className={`${activeView === "following" ? "bg-transparent" : ""} flex-1 rounded-b-none rounded-l-none hover:scale-1 active:scale-1 h-12 hover:bg-muted/50`}
          >
            {formatNumber(followingCount)} Following
          </Button>
        </div>

        {activeView === "followers" ? (
          <UserList key="followers" endpoint={`/api/user/${user.id}/followers`} />
        ) : (
          <UserList key="following" endpoint={`/api/user/${user.id}/following`} />
        )}
      </DialogContent>
    </Dialog>
  );
};
