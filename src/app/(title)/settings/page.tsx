import type { Metadata } from "next";
import { LatestCommit } from "~/components/LatestCommit";
import { ThemeSettings } from "~/components/ThemeSettings";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LogoutButton } from "~/components/web3/WalletButtons";
import { WalletInfo } from "~/components/web3/WalletInfo";
import { getServerAuth } from "~/utils/getServerAuth";
import Link from "next/link";
import { Button } from "~/components/ui/button";

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
  const { isAuthenticated } = await getServerAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="text-muted-foreground">Please sign in with Ethereum to access your settings.</p>
        <Button asChild>
          <Link href="/login">Sign in with Ethereum</Link>
        </Button>
      </div>
    );
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
