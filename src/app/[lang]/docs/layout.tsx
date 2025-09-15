import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import type { ReactNode } from "react";
import PaperLogo from "~/components/icons/PaperLogo";
import { source } from "~/utils/docs/source";
import { i18n } from "~/utils/i18n";

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
    i18n,
    searchToggle: {
      enabled: true,
    },
  };
}

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <DocsLayout
      tree={source.getPageTree(lang)}
      {...baseOptions()}
      sidebar={{
        defaultOpenLevel: 1,
      }}
    >
      {children}
    </DocsLayout>
  );
}
