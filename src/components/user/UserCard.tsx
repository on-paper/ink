"use client";

import type { User } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { FollowButton } from "../FollowButton";
import { Badge } from "../ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";
import { UserAvatar } from "./UserAvatar";

const fetchUser = async (addressOrEns: string): Promise<User> => {
  const response = await fetch(`/api/user/ens/${addressOrEns}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load user");
  }

  return data;
};

export const UserCard = ({ children, handle, address }: PropsWithChildren & { handle?: string; address?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const identifier = handle || address;

  if (!identifier) {
    return <>{children}</>;
  }

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user", "ens", identifier],
    queryFn: () => fetchUser(identifier),
    enabled: !!identifier && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const isFollowingMe = user?.actions?.following;

  return (
    <HoverCard defaultOpen={false} onOpenChange={setIsOpen} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-[20rem] not-prose" side="top">
        {isLoading && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-start gap-2 text-base">
              <div className="flex flex-row items-center gap-4 flex-1 min-w-0">
                <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="mt-3">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}
        {isError && <div>Error: {error?.message || "Failed to load user"}</div>}
        {user && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-start gap-2 text-base">
              <div className="flex flex-row items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 flex-shrink-0">
                  <UserAvatar card={false} user={user} />
                </div>
                <div className="flex flex-wrap gap-2 min-w-0 flex-1">
                  <span className="font-bold truncate text-lg">{user.username}</span>
                  {isFollowingMe && (
                    <Badge className="text-sm h-fit w-fit mt-1" variant="secondary">
                      Follows you
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 leading-5">
              <p className="text-sm line-clamp-5">{user.description}</p>
            </div>
            <div className="mt-3">
              <FollowButton className="w-full" user={user} />
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};
