interface TokenLinkProps {
  tokenAddress: string;
  scanUrl: string;
  colorClasses?: string;
  tokenMetadata?: {
    symbol: string;
    name: string;
  };
}

export function TokenLink({ tokenAddress, scanUrl, colorClasses = "", tokenMetadata }: TokenLinkProps) {
  const displayText = tokenMetadata?.symbol
    ? `$${tokenMetadata.symbol}`
    : `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  return (
    <a
      href={scanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`lexical-link ${colorClasses}`}
      title={tokenMetadata?.name || tokenAddress}
    >
      {displayText}
    </a>
  );
}
