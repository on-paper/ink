"use client";

import { CheckCircle, Copy, ExternalLink, Wallet, XCircle } from "lucide-react";
import { useState } from "react";
import { useAccount, useBalance, useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const WalletInfo = () => {
  const { address, isConnected, connector, chain } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: mainnet.id });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined, chainId: mainnet.id });
  const { data: balance } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <XCircle className="h-4 w-4" />
        <span>No wallet connected</span>
      </div>
    );
  }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (value?: bigint, decimals?: number) => {
    if (!value) return "0";
    const divisor = BigInt(10 ** (decimals || 18));
    const beforeDecimal = value / divisor;
    const afterDecimal = value % divisor;
    const afterDecimalStr = afterDecimal.toString().padStart(decimals || 18, "0");
    const significantDecimals = afterDecimalStr.slice(0, 4);
    return `${beforeDecimal}.${significantDecimals}`;
  };

  return (
    <div className="space-y-4">
      {/* Wallet Identity */}
      <div className="flex items-start gap-3">
        {ensAvatar ? (
          <img src={ensAvatar} alt="ENS Avatar" className="w-12 h-12 rounded-full border border-border" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 space-y-1">
          {ensName && <div className="font-medium text-base">{ensName}</div>}
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-muted-foreground">{formatAddress(address)}</code>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted rounded transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground mb-1">Wallet</div>
          <div className="font-medium">{connector?.name || "Unknown"}</div>
        </div>

        <div>
          <div className="text-muted-foreground mb-1">Network</div>
          <div className="font-medium flex items-center gap-1">{chain?.name || "Unknown"}</div>
        </div>

        {balance && (
          <div>
            <div className="text-muted-foreground mb-1">Balance</div>
            <div className="font-medium font-mono text-xs">
              {formatBalance(balance.value, balance.decimals)} {balance.symbol}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
