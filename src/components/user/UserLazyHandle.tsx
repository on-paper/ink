"use client";

import Link from "next/link";
import { UserCard } from "./UserCard";

export const UserLazyHandle = ({ handle, className }: { handle: string; className?: string }) => {
  return (
    <UserCard handle={handle}>
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/u/${handle}`}
        prefetch
        style={{ color: "currentColor" }}
        className={className}
      >
        {handle}
      </Link>
    </UserCard>
  );
};
