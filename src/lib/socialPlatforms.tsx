import type { LucideIcon } from "lucide-react";
import { Globe, Link } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaReddit,
  FaSnapchat,
  FaSpotify,
  FaTelegram,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { SiBluesky, SiFarcaster } from "react-icons/si";

function cleanUsername(
  value: string,
  removeProtocol = true,
  removeDomains: string[] = [],
  removeTrailingSlash = true,
  removeAt = true,
): string {
  let username = value;
  if (removeProtocol) {
    username = username.replace(/^https?:\/\//, "");
  }
  for (const domain of removeDomains) {
    const regex = new RegExp(`^(www\\.)?${domain.replace(/\./g, "\\.")}\\/?`, "i");
    username = username.replace(regex, "");
  }
  if (removeTrailingSlash) {
    username = username.replace(/\/$/, "");
  }
  if (removeAt) {
    username = username.replace(/^@/, "");
  }
  return username;
}

export interface SocialPlatform {
  value: string;
  label: string;
  placeholder: string;
  prefix: string;
  icon: IconType | LucideIcon;
  domains?: string[];
  getUrl: (value: string) => string;
}

export const socialPlatforms: SocialPlatform[] = [
  {
    value: "x",
    label: "X",
    placeholder: "username",
    prefix: "x.com/",
    icon: FaXTwitter,
    domains: ["x.com", "twitter.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["x.com", "twitter.com"]);
      return `https://x.com/${username}`;
    },
  },
  {
    value: "website",
    label: "Website",
    placeholder: "example.com",
    prefix: "https://",
    icon: Globe,
    getUrl: (value: string) => (value.startsWith("http") ? value : `https://${value}`),
  },
  {
    value: "telegram",
    label: "Telegram",
    placeholder: "username",
    prefix: "@",
    icon: FaTelegram,
    domains: ["t.me", "telegram.me"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["t.me", "telegram.me"]);
      return `https://t.me/${username}`;
    },
  },
  {
    value: "discord",
    label: "Discord",
    placeholder: "username",
    prefix: "@",
    icon: FaDiscord,
    domains: ["discord.com", "discord.gg"],
    getUrl: (value: string) => `https://discord.com/users/${value.replace(/^@/, "")}`,
  },
  {
    value: "instagram",
    label: "Instagram",
    placeholder: "username",
    prefix: "instagram.com/",
    icon: FaInstagram,
    domains: ["instagram.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["instagram.com"]);
      return `https://instagram.com/${username}`;
    },
  },
  {
    value: "tiktok",
    label: "TikTok",
    placeholder: "username",
    prefix: "tiktok.com/",
    icon: FaTiktok,
    domains: ["tiktok.com"],
    getUrl: (value: string) => {
      let username = value;
      username = username.replace(/^https?:\/\//, "");
      username = username.replace(/^(www\.)?tiktok\.com\/@?/, "");
      username = username.replace(/\/$/, "");
      username = username.replace(/^@/, "");
      return `https://tiktok.com/@${username}`;
    },
  },
  {
    value: "youtube",
    label: "YouTube",
    placeholder: "username",
    prefix: "youtube.com/",
    icon: FaYoutube,
    domains: ["youtube.com", "youtu.be"],
    getUrl: (value: string) => {
      let username = value;
      username = username.replace(/^https?:\/\//, "");
      username = username.replace(/^(www\.)?youtube\.com\/(@|c\/|channel\/)?/, "");
      username = username.replace(/\/$/, "");
      return `https://youtube.com/${username}`;
    },
  },
  {
    value: "twitch",
    label: "Twitch",
    placeholder: "username",
    prefix: "twitch.tv/",
    icon: FaTwitch,
    domains: ["twitch.tv"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["twitch.tv"]);
      return `https://twitch.tv/${username}`;
    },
  },
  {
    value: "facebook",
    label: "Facebook",
    placeholder: "username",
    prefix: "facebook.com/",
    icon: FaFacebook,
    domains: ["facebook.com", "fb.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["facebook.com", "fb.com"]);
      return `https://facebook.com/${username}`;
    },
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    placeholder: "username",
    prefix: "linkedin.com/",
    icon: FaLinkedin,
    domains: ["linkedin.com"],
    getUrl: (value: string) => {
      let username = value;
      username = username.replace(/^https?:\/\//, "");
      username = username.replace(/^(www\.)?linkedin\.com\/(in\/)?/, "");
      username = username.replace(/\/$/, "");
      return `https://linkedin.com/in/${username}`;
    },
  },
  {
    value: "pinterest",
    label: "Pinterest",
    placeholder: "username",
    prefix: "pinterest.com/",
    icon: FaPinterest,
    domains: ["pinterest.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["pinterest.com"]);
      return `https://pinterest.com/${username}`;
    },
  },
  {
    value: "reddit",
    label: "Reddit",
    placeholder: "username",
    prefix: "reddit.com/",
    icon: FaReddit,
    domains: ["reddit.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["reddit.com"]);
      return `https://reddit.com/u/${username}`;
    },
  },
  {
    value: "snapchat",
    label: "Snapchat",
    placeholder: "username",
    prefix: "snapchat.com/",
    icon: FaSnapchat,
    domains: ["snapchat.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["snapchat.com"]);
      return `https://snapchat.com/add/${username}`;
    },
  },
  {
    value: "spotify",
    label: "Spotify",
    placeholder: "username",
    prefix: "spotify.com/",
    icon: FaSpotify,
    domains: ["spotify.com", "open.spotify.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["spotify.com", "open.spotify.com"]);
      return `https://open.spotify.com/user/${username}`;
    },
  },
  {
    value: "bluesky",
    label: "Bluesky",
    placeholder: "username",
    prefix: "bsky.app/",
    icon: SiBluesky,
    domains: ["bsky.app", "bluesky.social"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["bsky.app", "bluesky.social"]);
      return `https://bsky.app/profile/${username}`;
    },
  },
  {
    value: "farcaster",
    label: "Farcaster",
    placeholder: "username",
    prefix: "farcaster.xyz/",
    icon: SiFarcaster,
    domains: ["farcaster.xyz", "warpcast.com"],
    getUrl: (value: string) => {
      const username = cleanUsername(value, true, ["farcaster.xyz", "warpcast.com"]);
      return `https://farcaster.xyz/${username}`;
    },
  },
  {
    value: "link",
    label: "Link",
    placeholder: "url",
    prefix: "",
    icon: Link,
    getUrl: (value: string) => value,
  },
];

export function detectPlatform(value: string): SocialPlatform | null {
  if (!value) return null;

  const lowerValue = value.toLowerCase();

  for (const platform of socialPlatforms) {
    if (platform.domains) {
      for (const domain of platform.domains) {
        if (lowerValue.includes(domain)) {
          return platform;
        }
      }
    }
  }

  return null;
}
