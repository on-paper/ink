"use client";

import type { Notification } from "@cartel-sh/ui";
import {
  AtSignIcon,
  CirclePlusIcon,
  ExternalLinkIcon,
  HeartIcon,
  MessageCircleIcon,
  MessageSquareQuoteIcon,
  Repeat2Icon,
  ShieldIcon,
  ShieldOffIcon,
  UserPlusIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "~/components/Link";
import { useUserActions } from "~/hooks/useUserActions";
import { useFilteredUsers } from "../FilteredUsersContext";
import PostComposer from "../post/PostComposer";
import { ReactionsList } from "../post/PostReactions";
import { PostStateProvider } from "../post/PostStateContext";
import { TimeElapsedSince } from "../TimeLabel";
import { TruncatedText } from "../TruncatedText";
import { Card, CardContent } from "../ui/card";
import { ContextMenu as Context, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { UserAvatarArray } from "../user/UserAvatar";
import { useUser } from "../user/UserContext";
import { useNotifications } from "./NotificationsContext";

export const NotificationView = ({ item }: { item: Notification }) => {
  const { markAllAsRead, lastSeen } = useNotifications();
  const { mutedUsers, blockedUsers } = useFilteredUsers();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [isDissolving, setIsDissolving] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [isReplyWizardOpen, setReplyWizardOpen] = useState(false);

  // Get the primary user (first in the list) for context menu actions
  const primaryUser = item.who[0];
  const { muteUser, unmuteUser, blockUser, unblockUser } = useUserActions(primaryUser || undefined);

  const notificationTime = new Date(item.createdAt).getTime();
  const highlight = lastSeen !== null && notificationTime > lastSeen;

  const hasMutedUser = item.who.some((user) => user.actions?.muted || mutedUsers.has(user.id));
  const hasBlockedUser = item.who.some((user) => user.actions?.blocked || blockedUsers.has(user.id));
  const isJustMuted = item.who.some((user) => mutedUsers.has(user.id));
  const isJustBlocked = item.who.some((user) => blockedUsers.has(user.id));

  const isOnUserProfile = item.who.some((user) => pathname?.startsWith(`/u/${user.username}`));

  useEffect(() => {
    setTimeout(() => {
      if (highlight) {
        markAllAsRead();
        console.log("Marked all as read");
      }
    }, 300);
  }, [highlight]);

  useEffect(() => {
    if ((isJustMuted || isJustBlocked) && !isOnUserProfile) {
      setIsDissolving(true);
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isJustMuted, isJustBlocked, isOnUserProfile]);

  if (((hasMutedUser || hasBlockedUser) && !isOnUserProfile) || shouldHide) {
    return null;
  }

  const handleReply = () => {
    setReplyWizardOpen(!isReplyWizardOpen);
  };

  // biome-ignore format: keep it compact
  const notificationTextMap = {
    Reaction: <> <span className="font-semibold">liked</span> <HeartIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Comment: <> <span className="font-semibold">commented</span> <MessageCircleIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Follow: <> <span className="font-semibold">followed</span> <UserPlusIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Mention: <> <span className="font-semibold">mentioned</span>you<AtSignIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Repost: <> <span className="font-semibold">reposted</span> <Repeat2Icon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Action: item.actionType === "Tipping" 
      ? <> <span className="font-semibold">tipped</span> <CirclePlusIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></> 
      : <> <span className="font-semibold">{item.actionType === "PostAction" ? "performed an action on" : "acted"}</span> <CirclePlusIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
    Quote: <> <span className="font-semibold">quoted</span> <MessageSquareQuoteIcon className="-mb-0.5" size={16} strokeWidth={2.4} /></>,
  };

  const maxUsersPerNotification = 5;
  const uniqueUsers = item.who.filter((user, index, arr) => arr.findIndex((u) => u.id === user.id) === index);
  const users = uniqueUsers.slice(0, maxUsersPerNotification);
  const wasTruncated = uniqueUsers.length > maxUsersPerNotification;
  const amountTruncated = uniqueUsers.length - maxUsersPerNotification;
  const notificationText = notificationTextMap[item.type];

  const usersText = users.reduce((acc, profile, i, arr) => {
    const userName = profile.username;
    const userLink = (
      <Link
        key={profile.id + item.id + notificationTime}
        className="font-bold hover:underline whitespace-nowrap"
        href={`/u/${profile.username}`}
      >
        {userName}
      </Link>
    );
    const lastText = wasTruncated ? <span key="truncated">{amountTruncated} others</span> : userLink;

    if (i === 0) {
      return [userLink];
    }
    if (i === arr.length - 1) {
      return [...acc, <span key={`and-${i}`}> and </span>, lastText];
    }
    return [...acc, <span key={`comma-${i}`}>, </span>, userLink];
  }, [] as React.ReactNode[]);

  // For Comment notifications, we need to handle original post vs comment content
  let originalPostContent = "";
  let originalPostImage: string | undefined;
  let replyContent = "";
  let replyImage: string | undefined;

  if (item.type === "Comment" && item.actedOn) {
    // The comment itself (actedOn)
    const commentMetadata = item.actedOn.metadata as any;
    replyContent = commentMetadata && "content" in commentMetadata ? (commentMetadata.content as string) : "";

    if (commentMetadata) {
      if ("image" in commentMetadata && commentMetadata.image) {
        replyImage = (commentMetadata.image as any).item as string;
      } else if (
        "attachments" in commentMetadata &&
        Array.isArray(commentMetadata.attachments) &&
        commentMetadata.attachments[0]
      ) {
        replyImage = (commentMetadata.attachments[0] as any).item as string;
      }
    }

    // The original post that was commented on
    const originalPost = item.actedOn.commentOn || item.actedOn.reply;
    if (originalPost) {
      const originalMetadata = originalPost.metadata as any;
      originalPostContent =
        originalMetadata && "content" in originalMetadata ? (originalMetadata.content as string) : "";

      if (originalMetadata) {
        if ("image" in originalMetadata && originalMetadata.image) {
          originalPostImage = (originalMetadata.image as any).item as string;
        } else if (
          "attachments" in originalMetadata &&
          Array.isArray(originalMetadata.attachments) &&
          originalMetadata.attachments[0]
        ) {
          originalPostImage = (originalMetadata.attachments[0] as any).item as string;
        }
      }
    }
  } else {
    // For non-comment notifications, use existing logic
    const metadata = item?.actedOn?.metadata as any;
    originalPostContent = metadata && "content" in metadata ? (metadata.content as string) : "";
    if (metadata) {
      if ("image" in metadata && metadata.image) {
        originalPostImage = (metadata.image as any).item as string;
      } else if ("attachments" in metadata && Array.isArray(metadata.attachments) && metadata.attachments[0]) {
        originalPostImage = (metadata.attachments[0] as any).item as string;
      }
    }
  }

  // Check if we should show reactions for this notification type
  const showReactions = (item.type === "Comment" || item.type === "Quote") && item.actedOn;

  const notificationContent = (
    <>
      {isDissolving && (
        <svg className="absolute" width="0" height="0">
          <defs>
            <filter id={`dissolve-${item.id}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="turbulence" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale="20"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="5" />
              <animate attributeName="stdDeviation" values="0;10" dur="1s" fill="freeze" />
            </filter>
          </defs>
        </svg>
      )}
      <div className={`flex flex-col w-full ${isReplyWizardOpen && showReactions ? "gap-0" : "gap-1"}`}>
        <Context>
          <ContextMenuContent
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
            className="flex flex-col w-max gap-1 p-1 rounded-lg border"
          >
            {primaryUser && (
              <>
                <ContextMenuItem
                  onClick={() => {
                    router.push(`/u/${primaryUser.username}`);
                  }}
                >
                  <ExternalLinkIcon size={12} className="mr-2 h-4 w-4" />
                  View profile
                </ContextMenuItem>

                {user?.id !== primaryUser.id && (
                  <>
                    <ContextMenuItem
                      onClick={() => {
                        if (primaryUser.actions?.muted) {
                          unmuteUser();
                        } else {
                          muteUser();
                        }
                      }}
                    >
                      {primaryUser.actions?.muted ? (
                        <Volume2Icon size={12} className="mr-2 h-4 w-4" />
                      ) : (
                        <VolumeXIcon size={12} className="mr-2 h-4 w-4" />
                      )}
                      {primaryUser.actions?.muted ? "Unmute user" : "Mute user"}
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => {
                        if (primaryUser.actions?.blocked) {
                          unblockUser();
                        } else {
                          blockUser();
                        }
                      }}
                    >
                      {primaryUser.actions?.blocked ? (
                        <ShieldOffIcon size={12} className="mr-2 h-4 w-4" />
                      ) : (
                        <ShieldIcon size={12} className="mr-2 h-4 w-4" />
                      )}
                      {primaryUser.actions?.blocked ? "Unblock user" : "Block user"}
                    </ContextMenuItem>
                  </>
                )}

                {item.who.length > 1 && (
                  <ContextMenuItem
                    onClick={() => {
                      toast.info(`This notification involves ${item.who.length} users`);
                    }}
                    disabled
                    className="text-muted-foreground text-xs"
                  >
                    +{item.who.length - 1} more {item.who.length - 1 === 1 ? "user" : "users"}
                  </ContextMenuItem>
                )}
              </>
            )}
          </ContextMenuContent>
          <ContextMenuTrigger asChild>
            <Card
              className={`${highlight ? "bg-accent/20" : "bg-transparent backdrop-blur-3xl backdrop-opacity-80"} ${
                isReplyWizardOpen && showReactions ? "!rounded-b-none !border-b-0" : ""
              }`}
              style={{
                filter: isDissolving ? `url(#dissolve-${item.id})` : undefined,
                opacity: isDissolving ? 0 : 1,
                transition: "opacity 1s ease-out",
              }}
            >
              <CardContent className="flex h-fit w-full max-w-3xl flex-row gap-4 p-2 sm:p-4">
                <div className="shrink-0 grow-0 rounded-full">
                  <UserAvatarArray users={users} amountTruncated={wasTruncated ? amountTruncated : undefined} />
                </div>
                <div className="flex flex-col shrink grow gap-1 place-content-center w-full">
                  <div className="flex flex-row items-center justify-between w-full gap-2 select-none">
                    <div className="flex flex-wrap items-center gap-1 truncate text-ellipsis overflow-hidden">
                      <span>{usersText}</span>
                      <span className="flex flex-row gap-1 justify-center place-items-center">{notificationText}</span>
                    </div>
                    <span className="text-muted-foreground/60 shrink-0">
                      <TimeElapsedSince date={item.createdAt} />
                    </span>
                  </div>

                  {(originalPostContent || originalPostImage) && (
                    <Link
                      href={`/p/${
                        item.type === "Comment" && (item.actedOn?.commentOn || item.actedOn?.reply)
                          ? item.actedOn.commentOn?.id || item.actedOn.reply?.id
                          : item?.actedOn?.id
                      }`}
                      className="block rounded "
                    >
                      <div className="flex flex-row items-center gap-2 text-muted-foreground/60 text-sm line-clamp-1 text-ellipsis overflow-hidden">
                        {originalPostImage && (
                          <img
                            src={originalPostImage}
                            alt=""
                            className="w-6 h-6 object-cover rounded opacity-60 grayscale"
                          />
                        )}
                        {originalPostContent && (
                          <TruncatedText text={originalPostContent} maxLength={150} className="text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                  )}

                  {item.type === "Comment" && (replyContent || replyImage) && (
                    <Link href={`/p/${item.actedOn?.id}`} className="block rounded">
                      <div className="flex flex-row items-center gap-2 text-foreground text-sm line-clamp-2 text-ellipsis overflow-hidden">
                        {replyImage && <img src={replyImage} alt="" className="w-6 h-6 object-cover rounded" />}
                        {replyContent && (
                          <TruncatedText text={replyContent} maxLength={200} className="text-foreground" />
                        )}
                      </div>
                    </Link>
                  )}

                  {showReactions && (
                    <div className="-mt-1">
                      <ReactionsList post={item.actedOn} isComment={true} isReplyOpen={isReplyWizardOpen} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ContextMenuTrigger>
        </Context>
        {isReplyWizardOpen && showReactions && (
          <Card className="w-full p-4 rounded-xl !rounded-t-none !border-t-0">
            <PostComposer
              replyingTo={item.actedOn}
              isReplyingToComment={true}
              onSuccess={() => {
                setReplyWizardOpen(false);
              }}
            />
          </Card>
        )}
      </div>
    </>
  );

  // Wrap in PostStateProvider if needed
  if (showReactions) {
    return (
      <PostStateProvider post={item.actedOn} onReply={handleReply}>
        {notificationContent}
      </PostStateProvider>
    );
  }

  return notificationContent;
};
