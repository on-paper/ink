import {
  AtSignIcon,
  Bitcoin,
  CameraIcon,
  CircleSlashIcon,
  FrameIcon,
  GlobeIcon,
  HammerIcon,
  KeyboardOffIcon,
  LaughIcon,
  LeafIcon,
  LibraryIcon,
  LineChartIcon,
  MusicIcon,
  PaletteIcon,
  PartyPopperIcon,
  SproutIcon,
  TreeDeciduousIcon,
  WrenchIcon,
} from "lucide-react";

export type Community = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
};

export const stringToCommunity = (community: string) => {
  return {
    id: community,
    name: `/${community}`,
    description: null,
    image: null,
  };
};

export const getCommunityTags = (community: string) => {
  if (community === "" || !community) return [];

  const prefixes = ["", "interest-", "community-", "orbcommunities", "channel-", "topic-"];
  const tags = prefixes.map((prefix) => `${prefix}${community}`);

  return tags;
};

export const getCommunityIcon = (community: string) => {
  let icon = null;
  switch (community) {
    case "paper":
      icon = <AtSignIcon size={18} />;
      break;
    case "lens":
      icon = <SproutIcon size={18} />;
      break;
    case "art":
      icon = <PaletteIcon size={18} />;
      break;
    case "trading":
      icon = <LineChartIcon size={18} />;
      break;
    case "raave":
      icon = <PartyPopperIcon size={18} />;
      break;
    case "afk":
      icon = <KeyboardOffIcon size={18} />;
      break;
    case "touchgrass":
      icon = <LeafIcon size={18} />;
      break;
    case "photography":
      icon = <CameraIcon size={18} />;
      break;
    case "bonsai":
      icon = <TreeDeciduousIcon size={18} />;
      break;
    case "defi":
      icon = <Bitcoin size={18} />;
      break;
    case "zk":
      icon = <CircleSlashIcon size={18} />;
      break;
    case "lips":
      icon = <SproutIcon fill="hsl(var(--primary))" size={18} />;
      break;
    case "metaverse":
      icon = <GlobeIcon size={18} />;
      break;
    case "design":
      icon = <FrameIcon size={18} />;
      break;
    case "music":
      icon = <MusicIcon size={18} />;
      break;
    case "memes":
      icon = <LaughIcon size={18} />;
      break;
    case "books":
      icon = <LibraryIcon size={18} />;
      break;
    case "developers":
      icon = <WrenchIcon size={18} />;
      break;
    case "build":
      icon = <HammerIcon size={18} />;
      break;
    default:
      icon = null;
      break;
  }
  return icon;
};
