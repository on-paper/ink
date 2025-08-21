"use client";

import { type User } from "@cartel-sh/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber } from "~/utils/formatNumber";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
  
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<FeedResponse<User>>({
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

  // Auto-load more if container isn't full
  useEffect(() => {
    const checkAndLoadMore = () => {
      if (containerRef.current) {
        const scrollViewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          const hasScroll = scrollViewport.scrollHeight > scrollViewport.clientHeight;
          if (!hasScroll && hasNextPage && !isFetchingNextPage) {
            loadNextBatch();
          }
        }
      }
    };

    // Check after a short delay to ensure DOM is ready
    const timer = setTimeout(checkAndLoadMore, 200);
    return () => clearTimeout(timer);
  }, [data, hasNextPage, isFetchingNextPage, loadNextBatch]);

  // Handle scroll for loading more
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const threshold = 100;
      
      if (target.scrollTop + target.clientHeight + threshold >= target.scrollHeight && !isFetchingNextPage && hasNextPage) {
        loadNextBatch();
      }
    };

    if (containerRef.current) {
      const scrollViewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]');
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
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-4 w-32 bg-muted rounded" />
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
        <div className="flex flex-col gap-2 pr-4">
          {items.filter(Boolean).map((item) => (
            <UserView key={item.id} item={item} />
          ))}
          {isFetchingNextPage && (
            <div className="animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          )}
          {!hasNextPage && items.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No more users to load
            </div>
          )}
          {items.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No users found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const UserFollowing = ({ user, followingCount, followersCount }: UserFollowingProps) => {
  const [activeTab, setActiveTab] = useState("followers");

  return (
    <Dialog>
      <DialogTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {formatNumber(followersCount)} {followersCount === 1 ? "follower" : "followers"}
      </DialogTrigger>
      <DialogContent className="max-w-lg backdrop-blur-md bg-card/60">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Followers ({formatNumber(followersCount)})</TabsTrigger>
            <TabsTrigger value="following">Following ({formatNumber(followingCount)})</TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">
            <UserList key="followers" endpoint={`/api/user/${user.id}/followers`} />
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <UserList key="following" endpoint={`/api/user/${user.id}/following`} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
