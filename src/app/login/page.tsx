"use client";

import { CreditCard, Loader2, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useConnect, useDisconnect } from "wagmi";
import { FamilyIcon, GlobeIcon, WalletConnectIcon } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/hooks/useSiweAuth";
import { prettifyViemError } from "~/utils/prettifyViemError";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isConnected, isLoading, signIn } = useAuth();
  const { connectors, connect } = useConnect({
    mutation: {
      onError: (error) => {
        const errorMessage = prettifyViemError(error);
        toast.error(errorMessage);
      },
    },
  });
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      signIn();
    }
  }, [isConnected]);

  const getConnectorButton = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return null;

    let name: string;
    let icon: React.JSX.Element;

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
      name = "Family Wallet";
      icon = (
        <div className="w-5 h-5">
          <FamilyIcon />
        </div>
      );
    } else if (connector.id === "xyz.ithaca.porto") {
      name = "Porto";
      icon = <CreditCard strokeWidth={1} className="w-5 h-5" />;
    } else if (connector.id === "baseAccount") {
      name = "Base Account";
      icon = <Square strokeWidth={1} className="w-5 h-5" />;
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
          <CardDescription>Sign a message to prove your identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              {getConnectorButton("xyz.ithaca.porto")}
              {getConnectorButton("baseAccount")}
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
              <Button
                onClick={() => disconnect()}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                size="sm"
              >
                Go back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
