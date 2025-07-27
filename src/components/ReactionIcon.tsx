import { PostReactionType } from "@cartel-sh/ui";
import { BookmarkIcon, CirclePlusIcon, HeartIcon, MessageCircleIcon, Repeat2Icon } from "lucide-react";
import { forwardRef } from "react";

interface ReactionIconProps {
  reaction: PostReactionType | "Like";
  pressed?: boolean;
  variant?: "post" | "comment";
}

const ReactionIcon = forwardRef<SVGSVGElement, ReactionIconProps>(({ reaction, pressed, variant = "post" }, ref) => {
  const isPost = variant === "post";
  const baseStroke = 2.2;
  const className = "transition-all duration-200";
  const strokeColor = pressed ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
  const fillColor = pressed ? "hsl(var(--primary))" : "none";

  const icons = {
    Like: (
      <HeartIcon
        size={isPost ? 18 : 16}
        strokeWidth={baseStroke}
        stroke={strokeColor}
        fill={fillColor}
        className={className}
        ref={ref}
      />
    ),
    Bookmark: (
      <BookmarkIcon
        size={isPost ? 18 : 16}
        strokeWidth={baseStroke}
        stroke={strokeColor}
        fill={fillColor}
        className={className}
        ref={ref}
      />
    ),
    Repost: (
      <Repeat2Icon
        size={isPost ? 20 : 18}
        strokeWidth={pressed ? 3.5 : 2}
        stroke={strokeColor}
        fill="none"
        className={className}
        ref={ref}
      />
    ),
    Collect: (
      <CirclePlusIcon
        size={isPost ? 18 : 16}
        strokeWidth={pressed ? 3.5 : 2.4}
        stroke={strokeColor}
        fill="none"
        className={className}
        ref={ref}
      />
    ),
    Comment: (
      <MessageCircleIcon
        size={isPost ? 18 : 15}
        strokeWidth={baseStroke}
        stroke={strokeColor}
        fill="none"
        className={className}
        ref={ref}
      />
    ),
  };

  return icons[reaction] || null;
});

export default ReactionIcon;
