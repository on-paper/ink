"use client";

import type { User } from "@cartel-sh/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "~/components/user/UserContext";
import { useUserMutations } from "~/hooks/useUserMutations";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { UserAvatar } from "./user/UserAvatar";

export const FollowButton = ({ user, className }: { user: User; className?: string }) => {
  const [isFollowing, setIsFollowing] = useState(user.actions.followed);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const followsMe = user.actions.following;
  const { requireAuth } = useUser();
  const { follow } = useUserMutations(user.id);

  const handleFollow = async () => {
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      await follow();
    } catch (error) {
      setIsFollowing(previousState);
      toast.error("Follow action failed");
    }
  };

  const handleUnfollow = async () => {
    setShowUnfollowDialog(false);
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      await follow();
    } catch (error) {
      setIsFollowing(previousState);
      toast.error("Unfollow action failed");
    }
  };

  const handleButtonClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      requireAuth(handleFollow);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={handleButtonClick}
        className={`font-semibold h-8 text-sm ${className}`}
      >
        {isFollowing ? "Following" : followsMe ? "Follow back" : "Follow"}
      </Button>

      <Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <DialogContent className="p-0 gap-0 max-w-xs rounded-2xl">
          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 mb-4">
              <UserAvatar user={user} link={false} card={false} />
            </div>
            <h2 className="text-lg font-semibold">Unfollow {user.username}?</h2>
          </div>
          <div className="flex w-full h-16">
            <Button
              variant="ghost"
              onClick={() => setShowUnfollowDialog(false)}
              className="w-1/2 rounded-none rounded-bl-lg border-t border-r hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={handleUnfollow}
              className="w-1/2 rounded-none rounded-br-lg border-t text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Unfollow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
