"use client";

import { chains } from "@lens-chain/sdk/viem";
import { LensProvider, mainnet, PublicClient } from "@lens-protocol/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { familyAccountsConnector } from "family";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type React from "react";
import { useEffect, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, mainnet as ethMainnet, optimism, baseSepolia, optimismSepolia, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { env } from "~/env.mjs";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { ExplosionProvider } from "./ExplosionPortal";
import "overlayscrollbars/styles/overlayscrollbars.css";

const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const url = getBaseUrl();

const isTestnet = env.NEXT_PUBLIC_NODE_ENV === "test" || env.NEXT_PUBLIC_NODE_ENV === "development";

const wagmiConfig = createConfig({
  chains: isTestnet 
    ? [chains.testnet, baseSepolia, sepolia, optimismSepolia] 
    : [chains.mainnet, base, ethMainnet, optimism],
  transports: {
    [chains.mainnet.id]: http(),
    [chains.testnet.id]: http(),
    [base.id]: http(),
    [ethMainnet.id]: http(),
    [optimism.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
  ssr: true,
  connectors: [
    familyAccountsConnector(),
    injected(),
    walletConnect({
      projectId: projectId,
      metadata: {
        name: "Pingpad",
        description: "minimalistic decentralized social",
        url: url,
        icons: ["https://pingpad.io/favicon.ico"],
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

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const publicClient = PublicClient.create({
    environment: mainnet,
  });

  return (
    <JotaiProvider>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableColorScheme>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider>
              <LensProvider client={publicClient}>
                <ExplosionProvider>
                  <OverlayScrollbarsComponent defer className="h-full">
                    {children}
                  </OverlayScrollbarsComponent>
                </ExplosionProvider>
              </LensProvider>
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
