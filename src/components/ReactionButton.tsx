import { PostReactionType } from "@cartel-sh/ui";
import ReactionIcon from "./ReactionIcon";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ReactionButtonProps = {
  reactionType: PostReactionType | "Like";
  reaction: { count: number; isActive: boolean };
  onClick: () => void;
  disabled?: boolean;
  variant?: "post" | "comment";
};

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  reactionType,
  reaction,
  onClick,
  disabled = false,
  variant = "post",
}) => {
  const formattedAmount = Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(reaction.count);

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`border-0 px-0 place-content-center items-center flex flex-row min-w-[2.2rem] gap-1.5 sm:gap-2 md:gap-3 hover:bg-transparent hover:scale-105 active:scale-95 data-[state=open]:scale-95 button-hover-bg 
        ${reaction.count > 0 ? "button-hover-bg-wide" : "button-hover-bg-equal"}`}
      disabled={disabled}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="transition-transform">
              <ReactionIcon variant={variant} pressed={reaction.isActive} reaction={reactionType} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`${reaction.count} ${reactionType.toLowerCase()}${reaction.count === 1 ? "" : "s"}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {reaction.count > 0 && (
        <span
          className={`inline-flex items-center leading-none transition-colors duration-200 text-xs font-bold 
            ${reaction.isActive ? "text-primary" : "text-muted-foreground"}`}
        >
          <span className="w-fit text-center">{formattedAmount}</span>
        </span>
      )}
    </Button>
  );
};
