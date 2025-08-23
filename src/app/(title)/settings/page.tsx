import { Info, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { LatestCommit } from "~/components/LatestCommit";
import { AppApprovalSettings } from "~/components/settings/AppApprovalSettings";
import { ThemeSettings } from "~/components/ThemeSettings";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DisconnectButton } from "~/components/web3/DisconnectButton";
import { WalletInfo } from "~/components/web3/WalletInfo";

export const metadata: Metadata = {
  title: "Settings",
  description: "Adjust your preferences",
  openGraph: {
    title: "Settings",
    description: "Adjust your preferences",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const settings = async () => {
  return (
    <div className="space-y-4">
      <ThemeSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" strokeWidth={2.5} />
            Wallet
          </CardTitle>
          <p className="text-sm text-muted-foreground">Your connected wallet information</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletInfo />
          <div className="pt-2">
            <DisconnectButton />
          </div>
        </CardContent>
      </Card>

      <AppApprovalSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" strokeWidth={2.5} />
            About
          </CardTitle>
          <p className="text-sm text-muted-foreground">Application information</p>
        </CardHeader>
        <CardContent>
          <LatestCommit />
        </CardContent>
      </Card>
    </div>
  );
};

export default settings;
