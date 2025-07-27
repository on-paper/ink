"use client";

import { type User, type UserStats } from "@cartel-sh/ui";
import { Link as LinkIcon, ShieldOffIcon, VolumeXIcon } from "lucide-react";
import { useState } from "react";
import { AvatarViewer } from "~/components/user/AvatarViewer";
import { useUserActions } from "~/hooks/useUserActions";
import { socialPlatforms } from "~/lib/socialPlatforms";
import { FollowButton } from "../FollowButton";
import PostComposer from "../post/PostComposer";
import { TruncatedText } from "../TruncatedText";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent } from "../ui/dialog";
import { EditProfileModal } from "./EditProfileModal";
import { useUser } from "./UserContext";
import { UserFollowing } from "./UserFollowing";

const MutedBadge = ({ onUnmute }: { onUnmute: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
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
    <div
      className="flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
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

export const UserProfile = ({ user, stats }: { user?: User; stats?: UserStats | null }) => {
  const { user: authedUser } = useUser();
  const { requireAuth } = useUser();
  const [isMentionDialogOpen, setIsMentionDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const userActions = useUserActions(user || ({} as User));

  if (!user) return null;

  const { unmuteUser, unblockUser } = userActions;

  const isUserProfile = user.id === authedUser?.id;
  const isFollowingMe = user.actions.following;
  const isMuted = user.actions?.muted;
  const isBlocked = user.actions?.blocked;
  const followingCount = stats?.following ?? 0;
  const followersCount = stats?.followers ?? 0;

  return (
    <Card className="p-6 pb-0 z-20 flex w-full flex-col gap-6 mt-4 rounded-xl overflow-hidden">
      <div className="flex flex-row gap-6">
        <div className="flex shrink-0 grow-0 w-12 h-12 sm:w-24 sm:h-24 self-start">
          <AvatarViewer user={user} />
        </div>

        <div className="flex flex-col gap-2  flex-grow">
          <div className="flex gap-2">
            <div className="text-xl sm:text-3xl/6 font-bold  w-fit truncate">{user.username}</div>
            {isFollowingMe && (
              <Badge variant="secondary" className="text-xs h-6 font-semibold">
                Follows you
              </Badge>
            )}
            {isMuted && !isUserProfile && <MutedBadge onUnmute={unmuteUser} />}
            {isBlocked && !isUserProfile && <BlockedBadge onUnblock={unblockUser} />}
          </div>

          <div className="flex flex-col gap-2">
            {user.description && (
              <div className="text-sm">
                <TruncatedText text={user.description} maxLength={300} isMarkdown={true} />
              </div>
            )}
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <UserFollowing user={user} followingCount={followingCount} followersCount={followersCount} />

                {/* Website link */}
                {user.metadata?.attributes &&
                  (() => {
                    const websiteAttr = user.metadata.attributes.find((attr) => attr.key === "website");
                    if (websiteAttr) {
                      const cleanUrl = websiteAttr.value.replace(/^https?:\/\//, "");
                      return (
                        <a
                          href={websiteAttr.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground no-underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span className="text-[#60a5fa] hover:underline">{cleanUrl}</span>
                        </a>
                      );
                    }
                    return null;
                  })()}
              </div>

              {/* Social icons */}
              {user.metadata?.attributes &&
                (() => {
                  const socialIcons = user.metadata.attributes
                    .filter((attr) => attr.key !== "website")
                    .map((attr) => {
                      const platform = socialPlatforms.find((p) => p.value === attr.key);

                      // Use generic link icon for unrecognized platforms
                      if (!platform && attr.key === "link") {
                        return (
                          <a
                            key={`${attr.key}-${attr.value}`}
                            href={attr.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Link"
                          >
                            <LinkIcon className="h-5 w-5" />
                          </a>
                        );
                      }

                      if (!platform) return null;

                      const Icon = platform.icon;
                      const url = platform.getUrl(attr.value);

                      return (
                        <a
                          key={attr.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`${platform.label} profile`}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      );
                    })
                    .filter(Boolean);

                  return socialIcons.length > 0 ? <div className="flex items-center gap-3">{socialIcons}</div> : null;
                })()}
            </div>
          </div>
        </div>
      </div>

      {isUserProfile ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 bg-transparent font-semibold"
          onClick={() => setIsEditProfileOpen(true)}
        >
          Edit Profile
        </Button>
      ) : (
        <div className="flex gap-2">
          <FollowButton user={user} className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              requireAuth(() => setIsMentionDialogOpen(true));
            }}
            className="flex-1 h-8 bg-transparent text-sm font-semibold"
          >
            Ping
          </Button>
        </div>
      )}

      <Dialog open={isMentionDialogOpen} onOpenChange={setIsMentionDialogOpen} modal={true}>
        <DialogContent className="max-w-full sm:max-w-[700px]">
          <Card className="p-4">
            <PostComposer
              user={authedUser}
              initialContent={`@lens/${user.username} `}
              onSuccess={() => setIsMentionDialogOpen(false)}
            />
          </Card>
        </DialogContent>
      </Dialog>

      {isUserProfile && (
        <EditProfileModal
          user={user}
          open={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </Card>
  );
};
