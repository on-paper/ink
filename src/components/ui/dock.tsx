import { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/src/utils";

interface DockProps {
  className?: string;
  items: {
    icon?: LucideIcon;
    customIcon?: React.ReactNode;
    label: string;
    onClick?: () => void;
    customComponent?: React.ReactNode;
    extra?: React.ReactNode;
    variant?: "default" | "secondary" | "primary";
    isActive?: boolean;
  }[];
}

interface DockIconButtonProps {
  icon?: LucideIcon;
  customIcon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  customComponent?: React.ReactNode;
  extra?: React.ReactNode;
  variant?: "default" | "secondary" | "primary";
  isActive?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  (
    {
      icon: Icon,
      customIcon,
      label,
      onClick,
      className,
      customComponent,
      extra,
      variant = "default",
      isActive,
      onHover,
      onLeave,
    },
    ref,
  ) => {
    if (customComponent) {
      return <div className="w-full">{customComponent}</div>;
    }

    const variantClasses = {
      default: "hover:bg-secondary/50",
      secondary: "bg-secondary/50 hover:bg-primary hover:text-primary-foreground",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className={cn(
          "relative group p-3 rounded-2xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center",
          "transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/60",
          variantClasses[variant],
          className,
        )}
      >
        {customIcon ? (
          <div className={cn("w-5 h-5 md:w-6 md:h-6 flex items-center justify-center")}>{customIcon}</div>
        ) : Icon ? (
          <Icon className={cn("w-5 h-5 md:w-6 md:h-6")} strokeWidth={2.25} />
        ) : null}
      </motion.button>
    );
  },
);
DockIconButton.displayName = "DockIconButton";

const Dock = React.forwardRef<HTMLDivElement, DockProps>(({ items, className }, ref) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setPreviousIndex(hoveredIndex);
      setHoveredIndex(index);
      setShowExtra(true);
    },
    [hoveredIndex],
  );

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowExtra(false);
      setHoveredIndex(null);
      setPreviousIndex(null);
    }, 200); // 0.2s delay
  }, []);

  const handleExtraMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleExtraMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowExtra(false);
      setHoveredIndex(null);
      setPreviousIndex(null);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const getContentAnimationY = () => {
    if (previousIndex === null || hoveredIndex === null) return 0;

    const direction = hoveredIndex > previousIndex ? 5 : -5;
    return direction;
  };

  const hoveredItem = hoveredIndex !== null ? items[hoveredIndex] : null;
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <div ref={ref} className={cn("flex items-center justify-center", className)}>
      <motion.div
        layout
        className={cn(
          "relative flex items-center gap-2 md:gap-3 p-2 rounded-2xl w-full",
          "flex-row justify-around sm:flex-col sm:justify-center sm:w-auto",
          // "shadow-lg",
        )}
      >
        <AnimatePresence mode="popLayout">
          {showExtra && hoveredItem && hoveredIndex !== null && buttonRefs.current[hoveredIndex] && (
            <div
              className={cn("absolute z-50 pointer-events-auto", !isDesktop && "-translate-x-1/2")}
              style={{
                ...(isDesktop
                  ? {
                      right: "calc(100% + 6px)",
                      top: `${buttonRefs.current[hoveredIndex]?.offsetTop}px`,
                      transform: `translateY(calc(-50% + ${buttonRefs.current[hoveredIndex]?.offsetHeight / 2}px))`,
                    }
                  : {
                      bottom: "calc(100% + 6px)",
                      left: `${buttonRefs.current[hoveredIndex]?.offsetLeft + buttonRefs.current[hoveredIndex]?.offsetWidth / 2}px`,
                    }),
              }}
            >
              <motion.div
                layoutId="dock-extra"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    opacity: { duration: 0.05 },
                    scale: { type: "spring", stiffness: 300, damping: 25 },
                    layout: { type: "spring", stiffness: 300, damping: 25 },
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.05 },
                }}
                onMouseEnter={handleExtraMouseEnter}
                onMouseLeave={handleExtraMouseLeave}
              >
                <motion.div
                  className="rounded-xl glass text-popover-foreground shadow-md overflow-hidden"
                  key={hoveredIndex}
                  initial={{ y: getContentAnimationY(), opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.1,
                    scale: { type: "spring", damping: 25, stiffness: 400 },
                  }}
                >
                  {hoveredItem.extra ? (
                    hoveredItem.extra
                  ) : (
                    <div className="px-3 py-1.5 text-base select-none font-medium text-muted-foreground whitespace-nowrap">
                      {hoveredItem.label}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {items.map((item, index) => (
          <div
            key={item.label}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            className="relative"
          >
            <DockIconButton {...item} onHover={() => handleMouseEnter(index)} onLeave={handleMouseLeave} />
          </div>
        ))}
      </motion.div>
    </div>
  );
});
Dock.displayName = "Dock";

export { Dock };
