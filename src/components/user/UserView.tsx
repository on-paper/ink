"use client";

import { User } from "@cartel-sh/ui";
import Link from "../Link";
import { Card } from "../ui/card";
import { UserAvatar } from "./UserAvatar";

export const UserView = ({ item }: { item: User }) => {
  return (
    <Link href={`/u/${item.username}`}>
      <Card className="flex flex-row gap-3 p-3 transition-colors cursor-pointer">
        <div className="w-12 h-12">
          <UserAvatar user={item} />
        </div>
        <div className="flex flex-col justify-center">
          <b className="text-base">@{item.username}</b>
        </div>
      </Card>
    </Link>
  );
};
