export type CAIP19URI = `eip155:${string}`;

export type AssetNamespace = string;

export interface CAIP19Components {
  namespace: string;
  chainId: string | number;
  assetNamespace?: AssetNamespace;
  assetReference?: string;
  tokenId?: string;
}

export const CHAIN_NAMESPACE = "eip155";

export function formatCAIP19URI(components: CAIP19Components): CAIP19URI {
  const { namespace, chainId, assetNamespace, assetReference, tokenId } = components;

  if (!assetNamespace || !assetReference) {
    return `${namespace}:${chainId}` as CAIP19URI;
  }

  if (!/^(erc[a-z0-9]{2,5}|slip44)$/.test(assetNamespace)) {
    throw new Error(`Invalid asset namespace: ${assetNamespace}`);
  }

  if (assetNamespace === "slip44") {
    if (!/^\d+$/.test(assetReference)) {
      throw new Error(`Invalid SLIP-44 coin type: ${assetReference}`);
    }
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(assetReference)) {
    throw new Error(`Invalid asset reference: ${assetReference}`);
  }

  let uri = `${namespace}:${chainId}/${assetNamespace}:${assetReference}`;

  if (tokenId) {
    if (!/^\d{1,78}$/.test(tokenId)) {
      throw new Error(`Invalid token ID: ${tokenId}`);
    }
    uri += `/${tokenId}`;
  }

  return uri as CAIP19URI;
}

export function parseCAIP19URI(uri: string): CAIP19Components | null {
  const caip19Pattern = /^eip155:(\d+)(?:\/([a-z0-9]+):(0x[a-fA-F0-9]{40}|\d+)(?:\/(\d{1,78}))?)?$/;
  const match = uri.match(caip19Pattern);

  if (!match) {
    return null;
  }

  const [, chainId, assetNamespace, assetReference, tokenId] = match;

  const components: CAIP19Components = {
    namespace: "eip155",
    chainId: Number.parseInt(chainId, 10),
  };

  if (assetNamespace && assetReference) {
    components.assetNamespace = assetNamespace;
    components.assetReference = assetNamespace === "slip44" ? assetReference : assetReference.toLowerCase();
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
