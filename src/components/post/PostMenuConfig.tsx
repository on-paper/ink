import type { LucideIcon } from "lucide-react";
import {
  BookmarkIcon,
  EditIcon,
  ExternalLinkIcon,
  ReplyIcon,
  Share2Icon,
  ShieldIcon,
  ShieldOffIcon,
  TrashIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

export type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  iconSize?: number;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "destructive";
  condition?: "always" | "isAuthor" | "notAuthor" | "hasReply";
  requiresAuth?: boolean;
  getDynamicProps?: (context: MenuContext) => Partial<MenuItem>;
};

export type MenuContext = {
  post: any;
  user: any;
  isMuted: boolean;
  isBlocked: boolean;
  isSaved: boolean;
  share: () => void;
  handleReply: () => void;
  handleExpand: () => void;
  deletePost: () => void;
  setEditingQuery: () => void;
  muteUser: () => void;
  unmuteUser: () => void;
  blockUser: () => void;
  unblockUser: () => void;
  postLink: string;
  savePost: () => void;
  txHash?: string;
  chainId?: number;
};

export const menuItems: MenuItem[] = [
  {
    id: "reply",
    label: "Reply",
    icon: ReplyIcon,
    iconSize: 18,
    condition: "hasReply",
    requiresAuth: true,
  },
  {
    id: "share",
    label: "Share",
    icon: Share2Icon,
    iconSize: 18,
    condition: "always",
  },
  {
    id: "view-transaction",
    label: "View transaction",
    icon: ExternalLinkIcon,
    iconSize: 18,
    condition: "always",
    getDynamicProps: (context) => ({
      disabled: !context.txHash || !context.chainId,
    }),
  },
  {
    id: "mute-user",
    label: "Mute user",
    icon: VolumeXIcon,
    iconSize: 18,
    condition: "notAuthor",
    requiresAuth: true,
    getDynamicProps: (context) => ({
      label: context.isMuted ? "Unmute user" : "Mute user",
      icon: context.isMuted ? Volume2Icon : VolumeXIcon,
      onClick: context.isMuted ? context.unmuteUser : context.muteUser,
    }),
  },
  {
    id: "block-user",
    label: "Block user",
    icon: ShieldIcon,
    iconSize: 18,
    condition: "notAuthor",
    requiresAuth: true,
    getDynamicProps: (context) => ({
      label: context.isBlocked ? "Unblock user" : "Block user",
      icon: context.isBlocked ? ShieldOffIcon : ShieldIcon,
      onClick: context.isBlocked ? context.unblockUser : context.blockUser,
    }),
  },
  {
    id: "save",
    label: "Save",
    icon: BookmarkIcon,
    iconSize: 18,
    condition: "always",
    requiresAuth: true,
    getDynamicProps: (context) => ({
      label: context.isSaved ? "Saved" : "Save",
      icon: BookmarkIcon,
      onClick: context.savePost,
    }),
  },
  {
    id: "edit-post",
    label: "Edit post",
    icon: EditIcon,
    iconSize: 18,
    condition: "isAuthor",
    requiresAuth: true,
    getDynamicProps: (context) => ({
      disabled: !context.post.reactions?.canEdit,
    }),
  },
  {
    id: "delete-post",
    label: "Delete post",
    icon: TrashIcon,
    iconSize: 18,
    condition: "isAuthor",
    variant: "destructive",
    requiresAuth: true,
  },
];
