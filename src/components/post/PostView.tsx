"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { UserAvatar } from "../user/UserAvatar";
import type { Post } from "./Post";
import { PostComments } from "./PostComments";
import { PostContent } from "./PostContent";
import { PostContextMenu } from "./PostContextMenu";
import { PostInfo } from "./PostInfo";
import { ReactionsList } from "./PostReactions";
import { ReplyInfo } from "./PostReplyInfo";
import { PostReplyWizard } from "./PostReplyWizard";

type PostViewSettings = {
  showBadges?: boolean;
  isComment?: boolean;
  isLastComment?: boolean;
  level?: number;
};

export const PostView = ({
  item,
  settings = { isComment: false, showBadges: true, level: 1 },
  defaultReplyOpen = false,
}: { item: Post; settings?: PostViewSettings; defaultReplyOpen?: boolean }) => {
  const content = "content" in item.metadata ? (item.metadata.content as string) : "";
  const [collapsed, setCollapsed] = useState(content.length > 400);
  const [isCommentsOpen, setCommentsOpen] = useState(false);
  const [isReplyWizardOpen, setReplyWizardOpen] = useState(defaultReplyOpen);
  const postContentRef = useRef<HTMLDivElement>(null);

  const handleReply = () => {
    setReplyWizardOpen(true);
  };

  return (
    <div className={"flex flex-col gap-2 w-full"}>
      <PostContextMenu post={item}>
        <Card
          onClick={() => {
            setCollapsed(false);
          }}
        >
          <CardContent className={`flex flex-row p-2 ${settings.isComment ? "sm:p-2 sm:pb-4 gap-2" : "sm:p-4 gap-4 "}`}>
            <span className="min-h-full flex flex-col justify-start items-center relative">
              <div className={`shrink-0 z-10 grow-0 rounded-full" ${settings.isComment ? "w-6 h-6" : "w-10 h-10"}`}>
                <UserAvatar user={item.author} />
              </div>
              {settings.isComment && (
                <div
                  className={`-mt-4 -mr-6 w-full h-[90%] relative
                    ${settings.isLastComment && "before:rounded-bl-lg before:border-b before:border-l before:w-[50%]"} 
                    ${settings.isComment && !settings.isLastComment && "min-h-[calc(100%+2rem)] before:w-[50%]"} 
                    before:absolute before:left-0 before:top-0 before:border-l before:border-border before:h-full`}
                />
              )}
            </span>
            <div className="flex w-3/4 shrink group max-w-2xl grow flex-col place-content-start">
              {!settings.isComment && <ReplyInfo post={item} />}
              <PostInfo post={item} />
              <PostContent ref={postContentRef} post={item} collapsed={collapsed} setCollapsed={setCollapsed} />
              {settings?.showBadges && (
                <ReactionsList
                  isComment={settings.isComment}
                  isCommentsOpen={isCommentsOpen}
                  setCommentsOpen={setCommentsOpen}
                  collapsed={collapsed}
                  post={item}
                  onReply={handleReply}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </PostContextMenu>
      <PostReplyWizard
        level={settings.level || 1}
        isOpen={isReplyWizardOpen}
        post={item}
        setOpen={setReplyWizardOpen}
      />
      <PostComments level={settings.level + 1} isOpen={isCommentsOpen} post={item} onReply={handleReply} />
    </div>
  );
};
