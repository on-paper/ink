import { Porto, RelayActions } from 'porto';
import { RelayClient } from 'porto/viem';
import { hashMessage } from 'viem';
import { parseSiweMessage } from 'viem/siwe';

export async function verifyPortoSignature(
  message: string,
  signature: string,
): Promise<{ isValid: boolean; address?: string; chainId?: number }> {
  try {
    const parsedMessage = parseSiweMessage(message);
    
    if (!parsedMessage.address || !parsedMessage.chainId) {
      console.error("Missing address or chainId in SIWE message");
      return { isValid: false };
    }
    
    const porto = Porto.create();
    const client = RelayClient.fromPorto(porto, { chainId: parsedMessage.chainId });
    
    const isValid = await RelayActions.verifySignature(client, {
      address: parsedMessage.address,
      digest: hashMessage(message),
      signature: signature as `0x${string}`,
    });
    
    if (isValid) {
      console.log("Porto signature verification successful");
      return {
        isValid: true,
        address: parsedMessage.address,
        chainId: parsedMessage.chainId,
      };
    } else {
      console.error("Porto signature verification failed");
      return { isValid: false };
    }
  } catch (error) {
    console.error("Error during Porto signature verification:", error);
    return { isValid: false };
  }
}

export function isPortoWallet(headers: Headers): boolean {
  const userAgent = headers.get("user-agent") || "";
  const referer = headers.get("referer") || "";
  const connectorId = headers.get("x-wallet-connector") || "";
  
  return connectorId === "xyz.ithaca.porto" ||
         userAgent.includes("Porto") || 
         referer.includes("porto") || 
         referer.includes("ithaca") ||
         userAgent.includes("ithaca");
}