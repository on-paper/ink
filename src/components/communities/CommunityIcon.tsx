"use client";

import { Users2 } from "lucide-react";
import { resolveUrl } from "~/utils/resolveUrl";

type CommunityLike = {
  address: string;
  metadata?: {
    icon?: string;
    name?: string;
  };
};

export function CommunityIcon({
  community,
  size = "sm",
  className,
}: {
  community: CommunityLike;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const containerClass =
    size === "lg"
      ? "w-20 h-20"
      : size === "md"
        ? "w-16 h-16"
        : "w-12 h-12"; // sm

  const imageClass =
    size === "lg"
      ? "w-14 h-14"
      : size === "md"
        ? "w-12 h-12"
        : "w-9 h-9"; // sm

  const fallbackClass =
    size === "lg"
      ? "w-10 h-10"
      : size === "md"
        ? "w-8 h-8"
        : "w-5 h-5"; // sm

  const backgroundUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${community.address.toLowerCase()}`;
  const iconUrl = resolveUrl(community.metadata?.icon);
  const altText = community.metadata?.name || community.address;

  return (
    <div
      className={`${containerClass} rounded-xl relative overflow-hidden flex items-center justify-center ${className || ""}`}
    >
      <img src={backgroundUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      {community.metadata?.icon ? (
        <img src={iconUrl} alt={altText} className={`${imageClass} rounded-lg object-cover relative z-10`} />
      ) : (
        <Users2 className={`${fallbackClass} text-foreground/90 relative z-10`} strokeWidth={2.5} />
      )}
    </div>
  );
}


