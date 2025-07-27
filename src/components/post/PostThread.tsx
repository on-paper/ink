"use client";

import type { Post } from "@cartel-sh/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthorThread } from "~/hooks/useAuthorThread";
import { useParentThread } from "~/hooks/useParentThread";
import { useScrollManagement } from "~/hooks/useScrollManagement";
import { Card } from "../ui/card";
import { PostSuspense } from "./PostSuspense";
import { PostView } from "./PostView";

export function PostThread({ post }: { post: Post }) {
  const [allComments, setAllComments] = useState<Post[]>([]);
  const [showReply, setShowReply] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<string | undefined>(undefined);
  const isLoadingRef = useRef(false);

  const { parentThread, loading: parentThreadLoading } = useParentThread(post);
  const { authorThread, loading: authorThreadLoading } = useAuthorThread(post);
  const { containerRef, mainPostRef } = useScrollManagement({
    parentThread,
    loading: parentThreadLoading,
  });

  const loadComments = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?${commentsCursor ? `cursor=${commentsCursor}` : ""}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(res.statusText);
      const { comments: newComments, nextCursor } = await res.json();
      const diffComments = newComments.filter((comment: Post) => !allComments.find((c) => c.id === comment.id));
      setAllComments((prevComments) => [...prevComments, ...diffComments]);
      setCommentsCursor(nextCursor);
    } catch (err) {
      console.error(`Could not fetch comments: ${err}`);
    } finally {
      setCommentsLoading(false);
      isLoadingRef.current = false;
    }
  }, [commentsCursor, post.id, allComments]);

  useEffect(() => {
    if (post.reactions.Comment > 0 && allComments.length === 0) {
      loadComments();
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 p-4">
      {parentThread.filter(Boolean).map((p) => (
        <div key={p.id} className="relative">
          <PostView settings={{ inThread: true }} item={p} />
        </div>
      ))}

      {parentThreadLoading && <PostSuspense />}
      <div className="flex flex-col gap-1 min-h-screen">
        <div ref={mainPostRef} className="relative">
          <PostView item={post} defaultExpanded={true} defaultReplyOpen={false} />
        </div>

        {authorThread.filter(Boolean).map((p) => (
          <div key={p.id} className="relative">
            <PostView settings={{ inThread: true }} item={p} />
          </div>
        ))}

        {allComments
          .filter((comment) => {
            const isMuted = comment.author.actions?.muted;
            const isBlocked = comment.author.actions?.blocked;
            return !isMuted && !isBlocked;
          })
          .map((comment) => (
            <div key={comment.id} className="relative">
              <PostView
                item={comment}
                settings={{
                  level: 0,
                  isComment: true,
                  showBadges: true,
                }}
              />
            </div>
          ))}

        {(authorThreadLoading || commentsLoading) && post.reactions.Comment > 0 && <PostSuspense />}
        {post.reactions.Comment === 0 && (
          <Card className="text-sm p-4 h-24 flex items-center justify-center text-center text-muted-foreground">
            No comments yet
          </Card>
        )}
      </div>
    </div>
  );
}
