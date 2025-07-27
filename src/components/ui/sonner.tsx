"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import "sonner/dist/styles.css";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast backdrop-blur-[16px] bg-background/40 group-[.toaster]:text-foreground group-[.toaster]:shadow-lg rounded-2xl p-3 px-4 border border-border/50",
          description: "group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground !rounded-lg",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground !rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground !rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
