import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import type { ReactNode } from "react";
import PaperLogo from "~/components/icons/PaperLogo";
import { source } from "~/utils/docs/source";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <PaperLogo className="w-5 h-5" stroke="currentColor" strokeWidth={2.25} />
          <span className="font-bold">Paper</span>
        </>
      ),
    },
    githubUrl: "https://github.com/on-paper/ink",
    themeSwitch: {
      enabled: true,
    },
    searchToggle: {
      enabled: true,
    },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        defaultOpenLevel: 1,
      }}
    >
      {children}
    </DocsLayout>
  );
}
