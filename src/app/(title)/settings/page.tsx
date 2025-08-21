import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LatestCommit } from "~/components/LatestCommit";
import { AppApprovalSettings } from "~/components/settings/AppApprovalSettings";
import { ThemeSettings } from "~/components/ThemeSettings";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LogoutButton } from "~/components/web3/WalletButtons";
import { WalletInfo } from "~/components/web3/WalletInfo";
import { getServerAuth } from "~/utils/getServerAuth";

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
  const { isAuthenticated, address } = await getServerAuth();
  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <ThemeSettings />

      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <p className="text-sm text-muted-foreground">Your connected wallet information</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletInfo />
          <div className="pt-2">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>

      <AppApprovalSettings />

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
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
