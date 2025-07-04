"use client";

import type { AccountStats } from "@lens-protocol/client";
import { EditIcon, ShieldOffIcon, VolumeXIcon } from "lucide-react";
import { useState } from "react";
import Link from "~/components/Link";
import { AvatarViewer } from "~/components/user/AvatarViewer";
import { useUserActions } from "~/hooks/useUserActions";
import { FollowButton } from "../FollowButton";
import PostComposer from "../post/PostComposer";
import { TruncatedText } from "../TruncatedText";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { type User } from "./User";
import { useUser } from "./UserContext";
import { UserFollowing } from "./UserFollowing";

const MutedBadge = ({ onUnmute }: { onUnmute: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex items-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUnmute}
        className={`h-6 px-2 transition-all duration-200 ${isHovered ? "pr-2" : ""}`}
      >
        <VolumeXIcon size={16} className="shrink-0" />
        <span
          className={`text-xs ml-1 overflow-hidden transition-all duration-200 ${isHovered ? "max-w-[45px] opacity-100" : "max-w-0 opacity-0"}`}
        >
          Unmute
        </span>
      </Button>
    </div>
  );
};

const BlockedBadge = ({ onUnblock }: { onUnblock: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex items-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUnblock}
        className={`h-6 px-2 transition-all duration-200 ${isHovered ? "pr-2" : ""}`}
      >
        <ShieldOffIcon size={16} className="shrink-0" />
        <span
          className={`text-xs ml-1 overflow-hidden transition-all duration-200 ${isHovered ? "max-w-[60px] opacity-100" : "max-w-0 opacity-0"}`}
        >
          Unblock
        </span>
      </Button>
    </div>
  );
};

const MentionPostComposer = ({ user, onClose }: { user: User; onClose: () => void }) => {
  const { user: currentUser } = useUser();

  const mentionPrefix = user.namespace === "eth" ? user.handle : `@lens/${user.handle}`;

  return <PostComposer user={currentUser} initialContent={`${mentionPrefix} `} onSuccess={() => onClose()} />;
};

export const UserProfile = ({ user, stats }: { user?: User; stats?: AccountStats | null }) => {
  const { user: authedUser } = useUser();
  const userActions = user ? useUserActions(user) : null;
  const [isMentionDialogOpen, setIsMentionDialogOpen] = useState(false);

  if (!user) return null;

  const { unmuteUser, unblockUser } = userActions!;

  const isUserProfile = user.id === authedUser?.id;
  const isFollowingMe = user.actions?.following;
  const isMuted = user.actions?.muted;
  const isBlocked = user.actions?.blocked;
  const followingCount = stats?.graphFollowStats.following ?? 0;
  const followersCount = stats?.graphFollowStats.followers ?? 0;
  const isEfpUser = user.namespace === "eth";

  return (
    <div className="p-6 z-20 flex w-full flex-col gap-4 glass drop-shadow-md mt-4 rounded-xl overflow-hidden">
      <div className="flex flex-row gap-4">
        <div className="flex shrink-0 grow-0 w-12 h-12 sm:w-24 sm:h-24 self-start">
          <AvatarViewer user={user} />
        </div>

        <div className="flex flex-col gap-4 flex-grow">
          <div className="flex flex-row items-center justify-between h-6 sm:h-12">
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                <div className="text-xl sm:text-2xl font-bold w-fit truncate leading-none">{user.name}</div>
                {isFollowingMe && !isEfpUser && (
                  <Badge variant="secondary" className="text-xs">
                    Follows you
                  </Badge>
                )}
                {isMuted && !isUserProfile && !isEfpUser && <MutedBadge onUnmute={unmuteUser} />}
                {isBlocked && !isUserProfile && !isEfpUser && <BlockedBadge onUnblock={unblockUser} />}
              </div>
              <div className="text-sm text-base-content font-light leading-none">
                {isEfpUser ? user.handle : `@${user.handle}`}
              </div>
            </div>

            <div className="flex flex-row items-center gap-2">
              {isUserProfile && (
                <Link className="btn btn-square btn-sm btn-ghost" href="/settings">
                  <EditIcon size={14} />
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {user.description && (
              <div className="text-sm">
                <TruncatedText text={user.description} maxLength={300} isMarkdown={true} />
              </div>
            )}
            <div className="flex justify-start">
              <UserFollowing user={user} followingCount={followingCount} followersCount={followersCount} />
            </div>
          </div>
        </div>
      </div>

      {!isUserProfile && (
        <div className="flex gap-2">
          <FollowButton user={user} className="flex-1" />
          {!isEfpUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMentionDialogOpen(true)}
              className="flex-1 bg-transparent"
            >
              Mention
            </Button>
          )}
        </div>
      )}

      <Dialog open={isMentionDialogOpen} onOpenChange={setIsMentionDialogOpen} modal={true}>
        <DialogContent className="max-w-full sm:max-w-[700px]">
          <MentionPostComposer user={user} onClose={() => setIsMentionDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
