import { base, mainnet } from "viem/chains";

export type CAIP19URI = `eip155:${string}`;

export type AssetNamespace = "erc20" | "erc721" | "erc1155" | "farcaster";

export interface CAIP19Components {
  namespace: string;
  chainId: string | number;
  assetNamespace?: AssetNamespace;
  assetReference?: string;
  tokenId?: string;
}

export const CHAIN_NAMESPACE = "eip155";

export const SUPPORTED_CHAINS = {
  [mainnet.id]: mainnet,
  [base.id]: base,
} as const;

export function formatCAIP19URI(components: CAIP19Components): CAIP19URI {
  const { namespace, chainId, assetNamespace, assetReference, tokenId } = components;

  if (!assetNamespace || !assetReference) {
    return `${namespace}:${chainId}` as CAIP19URI;
  }

  let uri = `${namespace}:${chainId}/${assetNamespace}:${assetReference}`;

  if (tokenId) {
    uri += `/${tokenId}`;
  }

  return uri as CAIP19URI;
}

export function parseCAIP19URI(uri: string): CAIP19Components | null {
  if (!uri.startsWith("eip155:")) {
    return null;
  }

  const parts = uri.split("/");

  if (parts.length === 0) {
    return null;
  }

  const [namespaceAndChain, assetInfo, tokenId] = parts;
  const [namespace, chainId] = namespaceAndChain.split(":");

  if (!namespace || !chainId || namespace !== "eip155") {
    return null;
  }

  const components: CAIP19Components = {
    namespace,
    chainId: Number.isNaN(Number(chainId)) ? chainId : Number(chainId),
  };

  if (assetInfo) {
    const [assetNamespace, assetReference] = assetInfo.split(":");
    if (assetNamespace && assetReference) {
      components.assetNamespace = assetNamespace as AssetNamespace;
      components.assetReference = assetReference;
    }
  }

  if (tokenId) {
    components.tokenId = tokenId;
  }

  return components;
}

export function getHandleFromCAIP19(uri: string): string | null {
  const components = parseCAIP19URI(uri);
  if (!components || !components.assetReference) {
    return null;
  }

  return null;
}
