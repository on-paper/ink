import type { User } from "@cartel-sh/ui";
import { ShieldIcon, ShieldOffIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { toast } from "sonner";
import { useFilteredUsers } from "~/components/FilteredUsersContext";

export const useUserActions = (user: User, onComplete?: () => void) => {
  const { addMutedUser, removeMutedUser, addBlockedUser, removeBlockedUser } = useFilteredUsers();

  const muteUser = async () => {
    // Optimistic update
    addMutedUser(user.id);

    const result = await fetch(`/api/user/${user.id}/mute`, {
      method: "POST",
    });
    const data = await result.json();

    if (result.ok) {
      toast("User muted", {
        icon: <VolumeXIcon size={16} />,
        action: {
          label: "Undo",
          onClick: () => {
            removeMutedUser(user.id);
            unmuteUser();
          },
        },
      });
    } else {
      // Revert on error
      removeMutedUser(user.id);
      toast.error(`${data.error}`);
    }
    onComplete?.();
  };

  const unmuteUser = async () => {
    removeMutedUser(user.id);

    const result = await fetch(`/api/user/${user.id}/unmute`, {
      method: "POST",
    });
    const data = await result.json();

    if (result.ok) {
      toast("User unmuted", {
        icon: <Volume2Icon size={16} />,
        action: {
          label: "Undo",
          onClick: () => muteUser(),
        },
      });
    } else {
      addMutedUser(user.id);
      toast.error(`${data.error}`);
    }
    onComplete?.();
  };

  const blockUser = async () => {
    addBlockedUser(user.id);

    const result = await fetch(`/api/user/${user.id}/block`, {
      method: "POST",
    });
    const data = await result.json();

    if (result.ok) {
      toast("User blocked", {
        icon: <ShieldIcon fill="currentColor" size={16} />,
        action: {
          label: "Undo",
          onClick: () => {
            removeBlockedUser(user.id);
            unblockUser();
          },
        },
      });
    } else {
      // Revert on error
      removeBlockedUser(user.id);
      toast.error(`${data.error}`);
    }
    onComplete?.();
  };

  const unblockUser = async () => {
    removeBlockedUser(user.id);

    const result = await fetch(`/api/user/${user.id}/unblock`, {
      method: "POST",
    });
    const data = await result.json();

    if (result.ok) {
      toast("User unblocked", {
        icon: <ShieldOffIcon size={16} />,
        action: {
          label: "Undo",
          onClick: () => blockUser(),
        },
      });
    } else {
      // Revert on error
      addBlockedUser(user.id);
      toast.error(`${data.error}`);
    }
    onComplete?.();
  };

  return { muteUser, unmuteUser, blockUser, unblockUser };
};
