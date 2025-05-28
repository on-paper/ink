"use client";

import {
  AtSignIcon,
  CirclePlusIcon,
  HeartIcon,
  MessageSquareIcon,
  MessageSquareQuoteIcon,
  Repeat2Icon,
  UserPlusIcon,
} from "lucide-react";
import Link from "~/components/Link";
import { TruncatedText } from "../TruncatedText";
import { Card, CardContent } from "../ui/card";
import { UserAvatarArray } from "../user/UserAvatar";
import type { Notification } from "./Notification";

export const NotificationView = ({ item, highlight = false }: { item: Notification; highlight?: boolean }) => {
  const post = (
    <Link className="hover:underline" href={`/p/${item?.actedOn?.id}`}>
      post
    </Link>
  );

  // biome-ignore format: keep it compact
  const notificationTextMap = {
    Reaction: <> liked your{post} <HeartIcon className="-mb-0.5" size={16} /></>,
    Comment: <> commented on your{post} <MessageSquareIcon className="-mb-0.5" size={16} /></>,
    Follow: <> started following you <UserPlusIcon className="-mb-0.5" size={16} /></>,
    Mention: <> mentioned you in their{post} <AtSignIcon className="-mb-0.5" size={16} /></>,
    Repost: <> reposted your{post} <Repeat2Icon className="-mb-0.5" size={16} /></>,
    Action: <> acted on your{post} <CirclePlusIcon className="-mb-0.5" size={16} /></>,
    Quote: <> quoted your{post} <MessageSquareQuoteIcon className="-mb-0.5" size={16} /></>,
  };

  const maxUsersPerNotification = 5;
  const users = item.who.slice(0, maxUsersPerNotification);
  const wasTruncated = item.who.length > maxUsersPerNotification;
  const amountTruncated = item.who.length - maxUsersPerNotification;
  const notificationText = notificationTextMap[item.type];

  const usersText = users.map((profile, i, arr) => {
    const userName = profile.name || profile.handle;
    const userLink = (
      <Link
        key={profile.id + item.id + item.type}
        className="font-bold hover:underline whitespace-nowrap"
        href={`/u/${profile.handle}`}
      >
        {userName}
      </Link>
    );
    const lastText = wasTruncated ? <>{amountTruncated} others</> : <>{userLink}</>;

    if (i === 0) return <span key={`${profile.id + item.id + item.type}first`}>{userLink}</span>;
    if (i === arr.length - 1) return <span key={`${profile.id + item.id + item.type}last`}> and {lastText}</span>;
    return <span key={`${profile.id + item.id + item.type}comma`}>, {userLink}</span>;
  });

  const content = item?.actedOn?.metadata && "content" in item.actedOn.metadata ? item?.actedOn?.metadata?.content : "";

  return (
    <Card className={highlight ? "bg-accent/20" : undefined}>
      <CardContent className="flex h-fit w-full flex-row gap-4 p-2 sm:p-4">
        <div className="shrink-0 grow-0 rounded-full">
          <UserAvatarArray users={users} amountTruncated={wasTruncated ? amountTruncated : undefined} />
        </div>
        <div className="flex flex-col shrink group max-w-md grow gap-1 place-content-center">
          <div className="flex flex-wrap whitespace-pre-wrap truncate text-ellipsis overflow-hidden">
            {usersText}
            <span className="flex flex-row gap-1 justify-center place-items-center">{notificationText}</span>
          </div>
          <div className="text-muted-foreground text-sm line-clamp-1 text-ellipsis overflow-hidden">
            <TruncatedText text={content as string} maxLength={150} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
