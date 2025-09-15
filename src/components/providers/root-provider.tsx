"use client";

import { RootProvider as FumaProvider } from "fumadocs-ui/provider";
import { defineI18nUI } from "fumadocs-ui/i18n";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { i18n } from "~/utils/i18n";


const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
      search: 'Search',
    },
    zh: {
      displayName: 'Chinese',
      search: '搜尋文檔',
    },
  },
});


export function RootProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentLocale = useMemo(() => {
    const first = pathname?.split("/").filter(Boolean)[0];
    return i18n.languages.includes(first as any) ? (first as typeof i18n.languages[number]) : i18n.defaultLanguage;
  }, [pathname]);
  const i18nProps = useMemo(() => provider(currentLocale), [provider, currentLocale]);

  return (
    <FumaProvider
      search={{
        enabled: true,
      }}
      theme={{
        enabled: true,
        defaultTheme: "dark",
      }}
      i18n={i18nProps}
    >
      {children}
    </FumaProvider>
  );
}
