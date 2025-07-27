import type { User } from "@cartel-sh/ui";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { UserCard } from "./UserCard";

export function UserAvatar({ user, link = true, card = true }: { user: User; link?: boolean; card?: boolean }) {
  const fallback = user?.username?.slice(0, 2) ?? "";
  const avatar = (
    <Avatar suppressHydrationWarning className="w-full h-full m-0">
      <AvatarImage alt={user?.profilePictureUrl} src={user?.profilePictureUrl} className="m-0 object-cover" />
      <AvatarFallback>{fallback.toLowerCase()}</AvatarFallback>
    </Avatar>
  );
  const avatarLink = link ? (
    <Link className="w-full h-full" href={`/u/${user.username}`} prefetch>
      {avatar}
    </Link>
  ) : (
    avatar
  );
  const avatarCard = card ? <UserCard handle={user.username}>{avatarLink}</UserCard> : avatarLink;

  return avatarCard;
}

export function UserAvatarArray({ users, amountTruncated }: { users: User[]; amountTruncated?: number }) {
  const avatars = users.map((user, index) => (
    <div key={`${user.id}-${index}`} className="w-10 h-10 -ml-4">
      <UserAvatar link={true} user={user} />
    </div>
  ));

  const formatAmount = Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountTruncated);

  return (
    <div className="flex flex-row pl-4">
      {avatars}
      {amountTruncated ? (
        <div className="w-10 h-10 -ml-4 rounded-full border-2 text-card-foreground text-base backdrop-blur-md border-accent text-center justify-center items-center flex z-10">
          +{formatAmount}
        </div>
      ) : null}
    </div>
  );
}

/// Get the URL for a stamp.fyi profile image.
///
/// @param address The address of the profile.
/// @returns The URL for the profile stamp image.
export function getStampUrl(address: string): string {
  return `https://cdn.stamp.fyi/avatar/${address}?s=140`;
}
