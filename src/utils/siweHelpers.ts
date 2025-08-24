export function extractConnectorInfo(headers: Headers): string {
  const userAgent = headers.get("user-agent") || "";
  const referer = headers.get("referer") || "";
  const connectorId = headers.get("x-wallet-connector") || "";
  
  // Return the connector ID if provided
  if (connectorId && connectorId !== "unknown") return connectorId;
  
  // Fallback to user agent/referer detection
  if (userAgent.includes("Porto") || referer.includes("porto") || referer.includes("ithaca")) return "porto";
  if (userAgent.includes("Family")) return "family";
  if (userAgent.includes("Base")) return "base-account";
  if (referer.includes("walletconnect")) return "walletconnect";
  if (userAgent.includes("MetaMask")) return "metamask";
  
  return "unknown";
}