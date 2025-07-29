import type { Post } from "@cartel-sh/ui";
import { Check, EllipsisIcon, Link2, PenIcon } from "lucide-react";
import { useState } from "react";
import { RiBlueskyLine } from "react-icons/ri";
import { SiFarcaster, SiX } from "react-icons/si";
import { toast } from "sonner";
import Link from "~/components/Link";
import { useUser } from "~/components/user/UserContext";
import { formatAddress } from "../menu/UserMenu";
import { TimeElapsedSince } from "../TimeLabel";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { menuItems } from "./PostMenuConfig";
import { usePostStateContext } from "./PostStateContext";

export const PostInfo = ({ post, onReply }: { post: Post; onReply?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { requireAuth } = useUser();
  const { shouldShowItem, getItemProps, postLink, isSaved } = usePostStateContext();
  const author = post.author;
  const handle = author.username;
  const displayName = handle || formatAddress(author.address);
  const tags = post?.metadata?.tags || [];
  const content = "content" in post.metadata ? (post.metadata.content as string) : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const sharePlatforms = [
    {
      name: "Farcaster",
      icon: <SiFarcaster className="w-4 h-4" />,
      getShareUrl: (url: string, title?: string) => {
        const text = title?.trim() ? `${title.trim()}\n\n${url}` : url;
        return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
      },
    },
    {
      name: "Twitter",
      icon: <SiX className="w-4 h-4" />,
      getShareUrl: (url: string, title?: string) => {
        // Twitter includes both text and URL in the same parameter for better control
        const text = title?.trim() ? `${title.trim()} | ${url}` : url;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      },
    },
    {
      name: "Bluesky",
      icon: <RiBlueskyLine className="w-4 h-4" />,
      getShareUrl: (url: string, title?: string) => {
        // Bluesky seems to strip newlines, so we'll use a separator
        const text = title?.trim() ? `${title.trim()} | ${url}` : url;
        return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
      },
    },
  ];

  let community = null;
  tags.map((tag: string) => {
    if (tag.includes("orbcommunities")) {
      community = tag.replace("orbcommunities", "");
    }
    if (tag.includes("channel")) {
      community = tag.split("-")[1];
    }
    if (tag.includes("community")) {
      community = tag.split("-")[1];
    }
  });

  return (
    <div
      suppressHydrationWarning
      className="group flex h-5 flex-row items-center place-items-center gap-2 text-xs font-light leading-4 text-base-content sm:text-sm"
    >
      <Link className="flex gap-2" href={`/u/${handle || author.address}`}>
        {/* <span className="w-fit truncate font-bold">{author.name}</span> */}
        <span className="font-bold w-fit">{`${displayName}`}</span>
      </Link>
      {community && (
        <>
          <span>{"·"}</span>
          <Link href={`/c/${community}`}>/{community}</Link>
        </>
      )}
      <span className="text-muted-foreground">
        <TimeElapsedSince date={post.createdAt} />
      </span>
      {post.isEdited && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground stroke-muted-foreground flex items-center justify-center cursor-default">
                <PenIcon rotate={180} size={12} strokeWidth={2} className="inline-block" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>This post was edited</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className="ml-auto">
        <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-transparent hover:scale-105 active:scale-95 data-[state=open]:scale-95 button-hover-bg button-hover-bg-equal"
            >
              <EllipsisIcon
                size={18}
                strokeWidth={2.2}
                stroke="hsl(var(--muted-foreground))"
                className="transition-all duration-200"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-max">
            {menuItems.map((item) => {
              if (!shouldShowItem(item)) return null;

              const itemProps = getItemProps(item);
              const Icon = itemProps.icon;

              if (item.id === "open-new-tab") {
                return (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link
                      href={postLink}
                      referrerPolicy="no-referrer"
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <Icon size={16} />
                      {itemProps.label}
                    </Link>
                  </DropdownMenuItem>
                );
              }

              if (item.id === "share") {
                return (
                  <DropdownMenuSub key={item.id}>
                    <DropdownMenuSubTrigger className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Icon size={16} />
                        <span>{itemProps.label}</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 glass" sideOffset={2} alignOffset={-5}>
                      {sharePlatforms.map((platform) => (
                        <DropdownMenuItem
                          key={platform.name}
                          onClick={(e) => {
                            e.preventDefault();
                            const shareUrl = platform.getShareUrl(postLink, content);
                            window.open(shareUrl, "_blank");
                            setOpen(false);
                          }}
                          className="flex items-center gap-3"
                        >
                          {platform.icon}
                          {platform.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-3">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4" />
                            Copy link
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              }

              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    if (item.requiresAuth) {
                      requireAuth(() => {
                        itemProps.onClick?.();
                        setOpen(false);
                      });
                    } else {
                      itemProps.onClick?.();
                      setOpen(false);
                    }
                  }}
                  disabled={itemProps.disabled}
                  className="flex items-center gap-3"
                >
                  <Icon size={16} fill={item.id === "save" && isSaved ? "currentColor" : "none"} />
                  {itemProps.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
