import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <BookOpen className="size-5" />
          <span className="font-semibold">Paper Docs</span>
        </>
      ),
    },
    githubUrl: "https://github.com/on-paper/ink",
    themeSwitch: {
      enabled: true,
    },
    links: [
      {
        text: "Documentation",
        url: "/docs",
        active: "nested-url",
      },
    ],
  };
}
