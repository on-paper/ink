import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

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
  const [error, setError] = useState<string | null>(null);

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
      setError("No wallet connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nonceRes = await fetch("/api/siwe/nonce");
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to Paper",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message: message.prepareMessage(),
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

      router.push("/home");
      window.location.reload();
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
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
    error,
    signIn,
    signOut,
    checkSession,
  };
}
