"use client";

import { RootProvider as FumaProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <FumaProvider
      search={{
        enabled: true,
      }}
      theme={{
        enabled: true,
        defaultTheme: "dark",
      }}
    >
      {children}
    </FumaProvider>
  );
}
