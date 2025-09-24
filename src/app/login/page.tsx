"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Connector } from "wagmi";
import { useConnect, useDisconnect } from "wagmi";

import { WalletConnectorButton, getConnectorDisplay } from "~/components/WalletConnectorButton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/hooks/useSiweAuth";
import { prettifyViemError } from "~/utils/prettifyViemError";
import { AnimatePresence, motion } from "motion/react";

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
  const [isOtherOptionsOpen, setIsOtherOptionsOpen] = useState(false);

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

  const handleConnect = useCallback(
    (connector: Connector) => {
      connect({ connector });
    },
    [connect],
  );

  const passkeyConnector = useMemo(
    () => connectors.find((connector) => connector.id === "xyz.ithaca.porto"),
    [connectors],
  );

  const otherConnectors = useMemo(
    () => connectors.filter((connector) => connector.id !== "xyz.ithaca.porto"),
    [connectors],
  );

  const handleOtherConnectorSelect = useCallback(
    (connector: Connector) => {
      handleConnect(connector);
      setIsOtherOptionsOpen(false);
    },
    [handleConnect],
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-[24rem]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Paper!</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-visible">
          {!isConnected ? (
            <div className="mx-auto w-full max-w-[24rem] flex flex-col gap-2 overflow-visible">
              {passkeyConnector ? (
                <WalletConnectorButton
                  connector={passkeyConnector}
                  onConnect={handleConnect}
                  className="w-full"
                  size="lg"
                  variant="default"
                />
              ) : null}

              {otherConnectors.length > 0 ? (
                <div className="flex flex-col overflow-visible">
                  <AnimatePresence initial={false}>
                    {isOtherOptionsOpen ? (
                      <motion.div
                        key="other-connectors"
                        id="login-other-connectors"
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: "auto", opacity: 1, marginBottom: 8 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.12, ease: [0.4, 0, 0.2, 1] } }}
                        className="flex flex-col gap-2 overflow-visible"
                      >
                        {otherConnectors.map((connector) => {
                          const { label, icon } = getConnectorDisplay(connector);
                          return (
                            <Button
                              key={connector.uid}
                              type="button"
                              variant="outline"
                              size="lg"
                              className="w-full justify-between px-6"
                              onClick={() => handleOtherConnectorSelect(connector)}
                            >
                              <span className="flex-1 text-left">{label}</span>
                              {icon}
                            </Button>
                          );
                        })}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    size="lg"
                    onClick={() => setIsOtherOptionsOpen((prev) => !prev)}
                    aria-expanded={isOtherOptionsOpen}
                    aria-controls={isOtherOptionsOpen ? "login-other-connectors" : undefined}
                  >
                    Other options
                    <motion.div
                      animate={{ rotate: isOtherOptionsOpen ? 180 : 0 }}
                      transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </div>
              ) : null}
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
