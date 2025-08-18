import type { Group } from "@cartel-sh/ui";
import type { ECPChannel } from "../channels";

export function ecpChannelToCommunity(channel: ECPChannel): Group {
  let rules: Group["rules"];

  if (channel.metadata?.["0"]?.value) {
    try {
      const hexValue = channel.metadata["0"].value;
      const decodedStr = Buffer.from(hexValue.slice(2), "hex").toString("utf8");
      const decodedData = JSON.parse(decodedStr);

      if (decodedData.rules && Array.isArray(decodedData.rules)) {
        rules = decodedData.rules.map((rule: string | { title: string; description: string }) => {
          if (typeof rule === "string") {
            return { title: rule, description: "" };
          }
          return rule;
        });
      }
    } catch (e) {
      console.error("Failed to decode metadata:", e);
    }
  }

  if (!rules && channel.metadata?.rules) {
    rules = channel.metadata.rules.map((rule: string | { title: string; description: string }) => {
      if (typeof rule === "string") {
        return { title: rule, description: "" };
      }
      return rule;
    });
  }

  return {
    id: channel.id,
    address: channel.id,
    timestamp: new Date(channel.createdAt),
    metadata: {
      name: channel.name,
      slug: channel.name.toLowerCase().replace(/\s+/g, "-"),
      description: channel.description || undefined,
      icon: channel.metadata?.icon || undefined,
      hook: channel.hook || undefined,
      ...(channel.metadata || {}),
    },
    rules,
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
