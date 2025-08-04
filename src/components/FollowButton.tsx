"use client";

import type { User } from "@cartel-sh/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useUser } from "~/components/user/UserContext";
import { useEFPList } from "~/hooks/useEFPList";
import { useEFPFollow } from "~/hooks/useEFPFollow";
import { useEFPFollowingState } from "~/hooks/useEFPFollowingState";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { UserAvatar } from "./user/UserAvatar";

export const FollowButton = ({ user, className }: { user: User; className?: string }) => {
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const { requireAuth } = useUser();
  const { address: connectedAddress } = useAccount();
  const { hasEFPList, isLoading: isLoadingList, primaryListId } = useEFPList();
  const router = useRouter();

  const userAddress = user.address as `0x${string}`;

  const { state: followingState, refetch: refetchFollowingState } = useEFPFollowingState({
    userAddress: connectedAddress || undefined,
    targetAddress: userAddress,
    listId: primaryListId,
  });

  const { follow, unfollow, isLoading, error } = useEFPFollow({
    listId: primaryListId,
    targetAddress: userAddress,
    onSuccess: () => {
      refetchFollowingState();
    },
  });

  const followsMe = user.actions.following;
  const isFollowing = followingState === "follows";

  const handleButtonClick = () => {
    console.log("[FollowButton] Click handler:", {
      connectedAddress,
      hasEFPList,
      isFollowing,
      isLoadingList,
    });

    if (!connectedAddress) {
      console.log("[FollowButton] No connected address, requiring auth");
      requireAuth(() => {});
      return;
    }

    if (!hasEFPList) {
      console.log("[FollowButton] No EFP List found, navigating to mint page");
      router.push("/mint-efp");
      return;
    }

    if (isFollowing) {
      console.log("[FollowButton] Already following, showing unfollow dialog");
      setShowUnfollowDialog(true);
    } else {
      console.log("[FollowButton] Not following, executing follow action");
      follow();
    }
  };

  const handleUnfollow = () => {
    setShowUnfollowDialog(false);
    unfollow();
  };

  const displayText = isFollowing ? "Following" : followsMe ? "Follow back" : "Follow";

  return (
    <>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={handleButtonClick}
        disabled={isLoading || isLoadingList}
        className={`font-semibold h-8 text-sm ${error ? "error" : ""} ${className}`}
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
        aria-pressed={isFollowing}
        title={error?.message || undefined}
      >
        {isLoading || isLoadingList ? "..." : displayText}
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
