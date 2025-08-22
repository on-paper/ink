"use client";

import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "../ui/button";

export function DisconnectButton() {
  const { isConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="text-sm"
      onClick={async () => {
        if (isConnected) {
          disconnectWallet();
        }
        await fetch("/api/siwe/logout", { method: "POST" });
        router.push("/home");
        router.refresh();
      }}
    >
      Disconnect
    </Button>
  );
}
