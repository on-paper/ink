"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { cn } from "~/utils";

export interface AnimatedPaperLogoHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedPaperLogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  strokeWidth?: number;
}

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 0.5,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0.5, 1],
  },
};

const pathTransition: Transition = {
  duration: 1.5,
  ease: "easeInOut",
};

const AnimatedPaperLogo = forwardRef<AnimatedPaperLogoHandle, AnimatedPaperLogoProps>(
  ({ className, size = 20, strokeWidth = 46, ...props }, ref) => {
    const controls = useAnimation();

    useImperativeHandle(ref, () => ({
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    }));

    return (
      <div className={cn(className)} {...props}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 493 487"
          fill="none"
          stroke="currentColor"
          strokeWidth={Number(strokeWidth) * 20}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            variants={pathVariants}
            animate={controls}
            transition={pathTransition}
          />
        </svg>
      </div>
    );
  },
);

AnimatedPaperLogo.displayName = "AnimatedPaperLogo";

export { AnimatedPaperLogo };
