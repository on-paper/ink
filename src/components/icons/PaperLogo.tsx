import type { LucideProps } from "lucide-react";
import { forwardRef } from "react";

const PaperLogo = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 20, strokeWidth = 46, color = "currentColor", ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 493 487"
        fill="none"
        stroke={color}
        strokeWidth={Number(strokeWidth) * 20}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z" />
      </svg>
    );
  },
);

PaperLogo.displayName = "PaperLogo";

export default PaperLogo;
