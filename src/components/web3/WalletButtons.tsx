"use client";

import { UserMinusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "../ui/button";

export function DisconnectWalletButton(props: PropsWithChildren) {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return null;
  }

  return (
    <Button variant="destructive" size="sm_icon" onClick={(_e) => disconnect()}>
      <div className="hidden sm:flex text-base">{props.children}</div>
    </Button>
  );
}

export function LogoutButton() {
  const { isConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      onClick={async () => {
        if (isConnected) {
          disconnectWallet();
        }
        await fetch("/api/siwe/logout", { method: "POST" });
        router.push("/home");
        router.refresh();
      }}
    >
      <UserMinusIcon size={20} className="sm:mr-2" />
      Log out
    </Button>
  );
}
