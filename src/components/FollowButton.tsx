"use client";

import type { User } from "@cartel-sh/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useUser } from "~/components/user/UserContext";
import { useEFPFollow } from "~/hooks/useEFPFollow";
import { useEFPList } from "~/hooks/useEFPList";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { UserAvatar } from "./user/UserAvatar";

export const FollowButton = ({ user, className }: { user: User; className?: string }) => {
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<"follow" | "unfollow" | null>(null);
  const { requireAuth } = useUser();
  const { address: connectedAddress } = useAccount();
  const { hasEFPList, primaryListId } = useEFPList();
  const router = useRouter();

  const userAddress = user.address as `0x${string}`;

  const isFollowing = optimisticFollowing !== null ? optimisticFollowing : user.actions?.followed || false;
  const followsMe = user.actions?.following;

  const { follow, unfollow, isLoading, error } = useEFPFollow({
    listId: primaryListId,
    targetAddress: userAddress,
    onSuccess: () => {
      setPendingAction(null);
    },
    onError: () => {
      setOptimisticFollowing(null);
      setPendingAction(null);
    },
  });

  const handleButtonClick = () => {
    console.log("[FollowButton] Click handler:", {
      connectedAddress,
      hasEFPList,
      isFollowing,
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
      setOptimisticFollowing(true);
      setPendingAction("follow");
      follow();
    }
  };

  const handleUnfollow = () => {
    setShowUnfollowDialog(false);
    setOptimisticFollowing(false);
    setPendingAction("unfollow");
    unfollow();
  };

  const getDisplayText = () => {
    if (pendingAction === "follow") return "Following...";
    if (pendingAction === "unfollow") return "Unfollowing...";
    if (isFollowing) return "Following";
    if (followsMe) return "Follow back";
    return "Follow";
  };

  return (
    <>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`font-semibold h-8 text-sm ${error ? "error" : ""} ${className}`}
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
        aria-pressed={isFollowing}
        title={error?.message || undefined}
      >
        {getDisplayText()}
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
