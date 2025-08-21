"use client";

import { User } from "@cartel-sh/ui";
import Link from "../Link";
import { Card } from "../ui/card";
import { UserAvatar } from "./UserAvatar";

export const UserView = ({ item }: { item: User }) => {
  const displayUsername = item.username || `${item.address.slice(0, 6)}...${item.address.slice(-4)}`;
  const href = `/u/${item.username || item.address}`;

  return (
    <Link href={href}>
      <Card className="flex flex-row gap-3 p-3 transition-colors cursor-pointer">
        <div className="w-12 h-12">
          <UserAvatar user={item} />
        </div>
        <div className="flex flex-col justify-center">
          <b className="text-base truncate">{displayUsername}</b>
        </div>
      </Card>
    </Link>
  );
};
