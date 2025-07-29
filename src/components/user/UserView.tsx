"use client";

import { User } from "@cartel-sh/ui";
import { useResolvedUser } from "~/hooks/useEnsResolver";
import Link from "../Link";
import { Card } from "../ui/card";
import { UserAvatar } from "./UserAvatar";

export const UserView = ({ item }: { item: User }) => {
  const resolvedUser = useResolvedUser(item);

  const displayUsername =
    resolvedUser.username === resolvedUser.address
      ? `${resolvedUser.address.slice(0, 6)}...${resolvedUser.address.slice(-4)}`
      : resolvedUser.username;

  return (
    <Link href={`/u/${resolvedUser.username}`}>
      <Card className="flex flex-row gap-3 p-3 transition-colors cursor-pointer">
        <div className="w-12 h-12">
          <UserAvatar user={resolvedUser} />
        </div>
        <div className="flex flex-col justify-center">
          <b className="text-base truncate">{displayUsername}</b>
        </div>
      </Card>
    </Link>
  );
};
