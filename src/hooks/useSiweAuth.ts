import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { prettifyViemError } from "~/utils/prettifyViemError";

interface SessionData {
  isAuthenticated: boolean;
  address?: string;
  chainId?: number;
  expirationTime?: string;
}

export function useAuth() {
  const { address, chainId, isConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [session, setSession] = useState<SessionData>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/siwe/session");
      const data = await res.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to check session:", err);
      setSession({ isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      toast.error("No wallet connected");
      return;
    }

    setIsLoading(true);

    try {
      const nonceRes = await fetch("/api/siwe/nonce");
      const { nonce } = await nonceRes.json();

      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to Paper",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
        issuedAt: new Date(),
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000 * 30 ), // 30 days
      });

      const signature = await signMessageAsync({
        message,
      });

      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          signature,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Failed to verify signature");
      }

      const sessionData = await verifyRes.json();
      setSession({
        isAuthenticated: true,
        address: sessionData.address,
        chainId: sessionData.chainId,
        expirationTime: sessionData.expirationTime,
      });

      toast.success("Welcome to Paper!");
      // Use window.location for navigation to ensure proper redirect
      window.location.href = "/home";
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errorMessage = prettifyViemError(err);
      toast.error("Authentication Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, connector, signMessageAsync]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/siwe/logout", { method: "POST" });
      setSession({ isAuthenticated: false });
      disconnect();
      // Use window.location for navigation to ensure proper redirect
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  return {
    address: session.address,
    isAuthenticated: session.isAuthenticated,
    isConnected,
    isLoading,
    signIn,
    signOut,
    checkSession,
  };
}
