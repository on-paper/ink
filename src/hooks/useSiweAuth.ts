import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createSiweMessage } from "viem/siwe";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { prettifyViemError } from "~/utils/prettifyViemError";

interface SessionData {
  isAuthenticated: boolean;
  address?: string;
  chainId?: number;
  expirationTime?: string;
}

export function useAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const router = useRouter();
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
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message,
      });

      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      router.push("/home");
      window.location.reload();
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errorMessage = prettifyViemError(err);
      toast.error("Authentication Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, signMessageAsync, router]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/siwe/logout", { method: "POST" });
      setSession({ isAuthenticated: false });
      disconnect();
      router.push("/");
      window.location.reload();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect, router]);

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
