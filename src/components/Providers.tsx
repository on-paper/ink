"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConnectKitProvider } from "connectkit";
import { TransactionProvider } from "ethereum-identity-kit";
import { familyAccountsConnector } from "family";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type React from "react";
import { useEffect, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { getAllChains, getAvailableChains } from "~/config/networks";
import { env } from "~/env.mjs";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { ExplosionProvider } from "./ExplosionPortal";
import "overlayscrollbars/styles/overlayscrollbars.css";
import { Toaster } from "~/components/ui/sonner";

const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const url = getBaseUrl();

const availableChains = getAvailableChains();
const allChains = getAllChains();
const transports = allChains.reduce(
  (acc, chain) => {
    acc[chain.id] = http();
    return acc;
  },
  {} as Record<number, ReturnType<typeof http>>,
);

const wagmiConfig = createConfig({
  chains: availableChains,
  transports,
  ssr: true,
  connectors: [
    familyAccountsConnector(),
    injected(),
    walletConnect({
      projectId: projectId,
      metadata: {
        name: "Paper",
        description: "minimalistic decentralized social",
        url: url,
        icons: ["https://paper.ink/favicon.ico"],
      },
      qrModalOptions: {
        themeMode: "dark",
        themeVariables: {
          "--wcm-font-family": "Quicksand, sans-serif",
          "--wcm-background-border-radius": "8px",
          "--wcm-container-border-radius": "8px",
          "--wcm-button-border-radius": "6px",
          "--wcm-button-hover-highlight-border-radius": "6px",
          "--wcm-icon-button-border-radius": "6px",
          "--wcm-background-color": "hsl(var(--popover))",
          "--wcm-accent-color": "rgb(148,158,158)",
          "--wcm-accent-fill-color": "hsl(var(--card-foreground))",
        },
      },
    }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default
    },
  },
  // Uncomment to enable console logging
  // queryCache: queryCache,
  // mutationCache: mutationCache,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <JotaiProvider>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableColorScheme>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider>
              <TransactionProvider>
                <ExplosionProvider>
                  <OverlayScrollbarsComponent defer className="h-full">
                    {children}
                  </OverlayScrollbarsComponent>
                  <Toaster position="top-center" offset={16} />
                  <ReactQueryDevtools initialIsOpen={false} />
                </ExplosionProvider>
              </TransactionProvider>
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
