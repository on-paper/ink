import type { Group } from "@cartel-sh/ui";
import type { ECPChannel } from "../channels";

export function ecpChannelToCommunity(channel: ECPChannel): Group {
  return {
    id: channel.id,
    address: channel.id,
    timestamp: new Date(channel.createdAt),
    metadata: {
      name: channel.name,
      slug: channel.name.toLowerCase().replace(/\s+/g, "-"),
      description: channel.description || undefined,
      icon: channel.metadata?.icon || undefined,
      ...(channel.metadata || {}),
    },
    feed: {
      address: channel.id,
    },
    operations: {
      canJoin: true,
      canLeave: false,
      canPost: true,
      isBanned: false,
    },
    owner: channel.owner,
    canPost: true,
    isBanned: false,
  };
}
