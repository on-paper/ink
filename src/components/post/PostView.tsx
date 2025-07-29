"use client";

import type { Post } from "@cartel-sh/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDeletedPosts } from "../DeletedPostsContext";
import { DissolveFilter } from "../DissolveFilter";
import { useFilteredUsers } from "../FilteredUsersContext";
import { Card, CardContent } from "../ui/card";
import { UserAvatar } from "../user/UserAvatar";
import PostComposer from "./PostComposer";
import { PostContent } from "./PostContent";
import { PostContextMenu } from "./PostContextMenu";
import { PostInfo } from "./PostInfo";
import { PostOptimisticView } from "./PostOptimisticView";
import { ReactionsList } from "./PostReactions";
import { ReplyInfo } from "./PostReplyInfo";
import { RepostInfo } from "./PostRepostInfo";
import { PostStateProvider } from "./PostStateContext";

type PostViewSettings = {
  showBadges?: boolean;
  isComment?: boolean;
  isLastComment?: boolean;
  level?: number;
  inThread?: boolean;
};

export const PostView = ({
  item,
  settings = { isComment: false, showBadges: true, level: 1 },
  defaultReplyOpen = false,
  defaultExpanded = false,
}: {
  item: Post;
  settings?: PostViewSettings;
  defaultReplyOpen?: boolean;
  defaultExpanded?: boolean;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const content = "content" in item.metadata ? (item.metadata.content as string) : "";
  const [collapsed, setCollapsed] = useState(defaultExpanded ? false : content.length > 400);
  const [isReplyWizardOpen, setReplyWizardOpen] = useState(defaultReplyOpen);
  const [isDissolving, setIsDissolving] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const postContentRef = useRef<HTMLDivElement>(null);
  const { mutedUsers, blockedUsers } = useFilteredUsers();
  const { deletedPosts } = useDeletedPosts();

  const dissolveFilterId = useMemo(() => `dissolve-${item.id}-${Date.now()}`, [item.id]);
  const isMuted = item.author.actions?.muted;
  const isBlocked = item.author.actions?.blocked;
  const isOnUserProfile = pathname?.startsWith(`/u/${item.author.username}`);
  const isJustMuted = mutedUsers.has(item.author.id);
  const isJustBlocked = blockedUsers.has(item.author.id);
  const isJustDeleted = deletedPosts.has(item.id);

  useEffect(() => {
    if ((isJustMuted || isJustBlocked) && !isOnUserProfile) {
      setIsDissolving(true);
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isJustMuted, isJustBlocked, isOnUserProfile]);

  useEffect(() => {
    if (isJustDeleted) {
      setIsDissolving(true);
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isJustDeleted]);

  if (((isMuted || isBlocked) && !isOnUserProfile) || shouldHide) {
    return null;
  }

  const handleReply = () => {
    setReplyWizardOpen(!isReplyWizardOpen);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    const target = e.target as HTMLElement;
    const interactiveSelectors = [
      "button",
      "a",
      "input",
      "textarea",
      "select",
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      "[data-radix-collection-item]",
      "video",
      "audio",
      "picture",
      "svg",
      "path",
      "iframe",
      "embed",
      "object",
      "img",
    ];

    const isInteractive = interactiveSelectors.some((selector) => target.matches(selector) || target.closest(selector));

    if (isInteractive) {
      return;
    }

    if (collapsed) {
      setCollapsed(false);
      return;
    }

    if (pathname === `/p/${item.id}`) {
      return;
    }

    router.push(`/p/${item.id}`);
  };

  const handleCardHover = () => {
    if (pathname !== `/p/${item.id}`) {
      router.prefetch(`/p/${item.id}`);
    }
  };

  if ((item as any).isOptimistic) {
    return <PostOptimisticView author={item.author} isComment={settings.isComment} />;
  }

  if (isEditing) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <PostComposer
            user={item.author}
            editingPost={item}
            quotedPost={item.quoteOn}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => {
              setIsEditing(false);
              router.refresh();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {isDissolving && <DissolveFilter filterId={dissolveFilterId} />}
      <div
        className={`flex flex-col w-full ${isReplyWizardOpen ? "gap-0" : "gap-1"} ${isDissolving ? "dissolving" : ""}`}
        style={{
          filter: isDissolving ? `url(#${dissolveFilterId})` : "none",
          opacity: isDissolving ? 0 : 1,
          maxHeight: isDissolving ? "0px" : "9999px",
          transition: "opacity 1s ease-out, max-height 1.0s ease-out",
          marginBottom: isDissolving ? "0" : undefined,
        }}
      >
        <PostStateProvider post={item} onReply={handleReply} onEditToggle={setIsEditing}>
          <PostContextMenu post={item} onReply={handleReply}>
            <Card
              className={`duration-300 transition-colors z-20 cursor-pointer relative 
                ${isReplyWizardOpen ? "!rounded-b-none !border-b-0" : ""}`}
              style={{ userSelect: "text" } as React.CSSProperties}
              onClick={handleCardClick}
              onMouseEnter={handleCardHover}
            >
              {isReplyWizardOpen && (
                <div
                  className={"absolute w-0.5 bg-border z-10 rounded-full"}
                  style={{
                    left: settings.isComment ? "27px" : "35.5px",
                    top: settings.isComment ? "48px" : "64px",
                    height: settings.isComment ? "calc(100% - 2.5rem)" : "calc(100% - 3.5rem)",
                  }}
                />
              )}
              <CardContent className={`flex flex-row p-4 ${settings.isComment ? "gap-2" : "gap-4 "}`}>
                <span className="min-h-full flex flex-col justify-start items-center relative">
                  <div className={`shrink-0 z-20 grow-0 rounded-full ${settings.isComment ? "w-6 h-6" : "w-10 h-10"}`}>
                    <UserAvatar user={item.author} />
                  </div>
                </span>
                <div className="flex w-3/4 shrink group max-w-2xl grow flex-col place-content-start">
                  {!settings.isComment && !settings.inThread && <RepostInfo post={item} />}
                  {!settings.isComment && !settings.inThread && !item.quoteOn && !item.isRepost && (
                    <ReplyInfo post={item} />
                  )}
                  <PostInfo post={item} onReply={handleReply} />
                  <PostContent ref={postContentRef} post={item} collapsed={collapsed} setCollapsed={setCollapsed} />
                  {settings?.showBadges && (
                    <div className="mt-1">
                      <ReactionsList isComment={settings.isComment} post={item} isReplyOpen={isReplyWizardOpen} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </PostContextMenu>
        </PostStateProvider>
        {isReplyWizardOpen && (
          <Card className="w-full p-4 rounded-xl !rounded-t-none !border-t-0">
            <PostComposer
              replyingTo={item}
              isReplyingToComment={settings.isComment}
              onSuccess={() => {
                setReplyWizardOpen(false);
              }}
            />
          </Card>
        )}
      </div>
    </>
  );
};
