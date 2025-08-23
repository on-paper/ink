import { describe, expect, it } from "bun:test";
import { formatCAIP19URI, parseCAIP19URI } from "../caip19";

describe("CAIP-19 URI Parsing and Formatting", () => {
  describe("parseCAIP19URI", () => {
    it("should parse ERC20 token URIs", () => {
      const uri = "eip155:1/erc20:0x1234567890123456789012345678901234567890";
      const result = parseCAIP19URI(uri);
      expect(result).toEqual({
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc20",
        assetReference: "0x1234567890123456789012345678901234567890",
      });
    });

    it("should parse ERC721 token URIs with token ID", () => {
      const uri = "eip155:1/erc721:0x1234567890123456789012345678901234567890/123";
      const result = parseCAIP19URI(uri);
      expect(result).toEqual({
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc721",
        assetReference: "0x1234567890123456789012345678901234567890",
        tokenId: "123",
      });
    });

    it("should parse SLIP-44 URIs", () => {
      const uri = "eip155:8453/slip44:60";
      const result = parseCAIP19URI(uri);
      expect(result).toEqual({
        namespace: "eip155",
        chainId: 8453,
        assetNamespace: "slip44",
        assetReference: "60",
      });
    });

    it("should parse SLIP-44 URIs on different chains", () => {
      const uri = "eip155:1/slip44:60";
      const result = parseCAIP19URI(uri);
      expect(result).toEqual({
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "slip44",
        assetReference: "60",
      });
    });

    it("should return null for invalid URIs", () => {
      expect(parseCAIP19URI("invalid")).toBeNull();
      expect(parseCAIP19URI("eip155:abc/erc20:0x123")).toBeNull();
      expect(parseCAIP19URI("eip155:1/invalid:0x123")).toBeNull();
    });

    it("should handle chain-only URIs", () => {
      const uri = "eip155:8453";
      const result = parseCAIP19URI(uri);
      expect(result).toEqual({
        namespace: "eip155",
        chainId: 8453,
      });
    });

    it("should lowercase ERC token addresses but not SLIP-44 references", () => {
      const ercUri = "eip155:1/erc20:0xABCDEF1234567890123456789012345678901234";
      const ercResult = parseCAIP19URI(ercUri);
      expect(ercResult?.assetReference).toBe("0xabcdef1234567890123456789012345678901234");

      const slipUri = "eip155:1/slip44:60";
      const slipResult = parseCAIP19URI(slipUri);
      expect(slipResult?.assetReference).toBe("60");
    });
  });

  describe("formatCAIP19URI", () => {
    it("should format ERC20 token URIs", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc20",
        assetReference: "0x1234567890123456789012345678901234567890",
      };
      const result = formatCAIP19URI(components);
      expect(result).toBe("eip155:1/erc20:0x1234567890123456789012345678901234567890");
    });

    it("should format ERC721 token URIs with token ID", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc721",
        assetReference: "0x1234567890123456789012345678901234567890",
        tokenId: "123",
      };
      const result = formatCAIP19URI(components);
      expect(result).toBe("eip155:1/erc721:0x1234567890123456789012345678901234567890/123");
    });

    it("should format SLIP-44 URIs", () => {
      const components = {
        namespace: "eip155",
        chainId: 8453,
        assetNamespace: "slip44",
        assetReference: "60",
      };
      const result = formatCAIP19URI(components);
      expect(result).toBe("eip155:8453/slip44:60");
    });

    it("should format chain-only URIs", () => {
      const components = {
        namespace: "eip155",
        chainId: 8453,
      };
      const result = formatCAIP19URI(components);
      expect(result).toBe("eip155:8453");
    });

    it("should throw error for invalid ERC asset reference", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc20",
        assetReference: "invalid",
      };
      expect(() => formatCAIP19URI(components)).toThrow("Invalid asset reference: invalid");
    });

    it("should throw error for invalid SLIP-44 reference", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "slip44",
        assetReference: "invalid",
      };
      expect(() => formatCAIP19URI(components)).toThrow("Invalid SLIP-44 coin type: invalid");
    });

    it("should throw error for invalid asset namespace", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "invalid",
        assetReference: "0x1234567890123456789012345678901234567890",
      };
      expect(() => formatCAIP19URI(components)).toThrow("Invalid asset namespace: invalid");
    });

    it("should throw error for invalid token ID", () => {
      const components = {
        namespace: "eip155",
        chainId: 1,
        assetNamespace: "erc721",
        assetReference: "0x1234567890123456789012345678901234567890",
        tokenId: "invalid",
      };
      expect(() => formatCAIP19URI(components)).toThrow("Invalid token ID: invalid");
    });
  });
});
