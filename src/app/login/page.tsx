"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useConnect } from "wagmi";
import { FamilyIcon, GlobeIcon, WalletConnectIcon } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/hooks/useSiweAuth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isConnected, isLoading, error, signIn } = useAuth();
  const { connectors, connect } = useConnect({
    mutation: {
      onError: (error) => {
        toast.error("Connection Failed", { description: error.message });
      },
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  const getConnectorButton = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return null;

    let name: string;
    let icon: JSX.Element;

    if (connector.id === "injected") {
      name = "Browser Wallet";
      icon = (
        <div className="w-5 h-5">
          <GlobeIcon />
        </div>
      );
    } else if (connector.id === "walletConnect") {
      name = "Wallet Connect";
      icon = <WalletConnectIcon />;
    } else if (connector.id === "familyAccountsProvider") {
      name = "Continue with Family";
      icon = (
        <div className="w-5 h-5">
          <FamilyIcon />
        </div>
      );
    } else {
      return null;
    }

    return (
      <Button
        key={connector.uid}
        className="w-full flex flex-row justify-between"
        variant="outline"
        onClick={() => connect({ connector })}
      >
        {name}
        {icon}
      </Button>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Paper</CardTitle>
          <CardDescription>Connect your wallet to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              {getConnectorButton("familyAccountsProvider")}
              {getConnectorButton("injected")}
              {getConnectorButton("walletConnect")}
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={signIn} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Ethereum"
                )}
              </Button>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
