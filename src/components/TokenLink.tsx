interface TokenLinkProps {
  tokenAddress: string;
  scanUrl: string;
  colorClasses?: string;
  tokenData?: {
    symbol: string;
    name: string;
  };
}

export function TokenLink({ tokenAddress, scanUrl, colorClasses = "", tokenData }: TokenLinkProps) {
  const displayText = tokenData?.symbol
    ? `$${tokenData.symbol}`
    : `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  return (
    <a
      href={scanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`lexical-link ${colorClasses}`}
      title={tokenData?.name || tokenAddress}
    >
      {displayText}
    </a>
  );
}
