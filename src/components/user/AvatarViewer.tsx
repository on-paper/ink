"use client";

import type { User } from "@cartel-sh/ui";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { UserAvatar } from "./UserAvatar";

export function AvatarViewer({ user }: { user: User }) {
  const src = user.profilePictureUrl;
  const alt = `@${user.username}'s profile picture`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full h-full cursor-pointer">
          <UserAvatar user={user} link={false} card={false} />
        </div>
      </DialogTrigger>
      {src ? (
        <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-fit">
          <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
