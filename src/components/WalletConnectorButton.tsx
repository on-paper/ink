"use client";

import { Fingerprint, Square, Wallet } from "lucide-react";
import * as React from "react";
import type { Connector } from "wagmi";

import { FamilyIcon, GlobeIcon, WalletConnectIcon } from "~/components/Icons";
import { Button, type ButtonProps } from "~/components/ui/button";
import { cn } from "~/utils";

type ConnectorDisplay = {
  label: string;
  icon: React.ReactNode;
};

export const connectorDisplayMap: Record<string, ConnectorDisplay> = {
  injected: {
    label: "Browser Wallet",
    icon: (
      <div className="h-5 w-5">
        <GlobeIcon />
      </div>
    ),
  },
  walletConnect: {
    label: "Wallet Connect",
    icon: <WalletConnectIcon />,
  },
  familyAccountsProvider: {
    label: "Family Wallet",
    icon: (
      <div className="h-5 w-5">
        <FamilyIcon />
      </div>
    ),
  },
  "xyz.ithaca.porto": {
    label: "Sign in with Passkey",
    icon: <Fingerprint className="h-5 w-5" strokeWidth={1.5} />,
  },
  baseAccount: {
    label: "Base Account",
    icon: <Square className="h-5 w-5" strokeWidth={1} />,
  },
};

export function getConnectorDisplay(connector: Connector): ConnectorDisplay {
  const display = connectorDisplayMap[connector.id];
  if (display) return display;

  return {
    label: connector.name ?? "Wallet",
    icon: <Wallet className="h-5 w-5" strokeWidth={1.2} />,
  };
}

export type WalletConnectorButtonProps = ButtonProps & {
  connector: Connector;
  onConnect: (connector: Connector) => void;
};

export const WalletConnectorButton = React.forwardRef<HTMLButtonElement, WalletConnectorButtonProps>(
  ({ connector, onConnect, className, variant = "outline", size = "default", onClick, ...buttonProps }, ref) => {
    const { label, icon } = React.useMemo(() => getConnectorDisplay(connector), [connector]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        onConnect(connector);
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn("w-full justify-between", className)}
        {...buttonProps}
      >
        <span className="flex-1 text-left">{label}</span>
        {icon}
      </Button>
    );
  },
);

WalletConnectorButton.displayName = "WalletConnectorButton";
