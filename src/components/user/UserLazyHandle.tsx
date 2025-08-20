"use client";

import Link from "next/link";
import { UserCard } from "./UserCard";

export const UserLazyHandle = ({ handle, className }: { handle: string; className?: string }) => {
  // Strip @ for URL but keep it for display
  const urlHandle = handle.replace(/^@/, "");

  return (
    <UserCard handle={urlHandle}>
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/u/${urlHandle}`}
        prefetch
        style={{ color: "currentColor" }}
        className={className}
      >
        {handle}
      </Link>
    </UserCard>
  );
};
