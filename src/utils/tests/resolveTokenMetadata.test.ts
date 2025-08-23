import { describe, expect, it } from "bun:test";
import { extractCAIP19URIs, resolveTokenMetadataFromContent } from "../resolveTokenMetadata";

describe("extractCAIP19URIs", () => {
  it("should extract ERC20 token URIs", () => {
    const content = "Check out this token: eip155:1/erc20:0x1234567890123456789012345678901234567890";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc20:0x1234567890123456789012345678901234567890"]);
  });

  it("should extract ERC721 token URIs with token ID", () => {
    const content = "NFT: eip155:1/erc721:0xabcdef1234567890123456789012345678901234/999";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc721:0xabcdef1234567890123456789012345678901234/999"]);
  });

  it("should extract SLIP-44 URIs", () => {
    const content = "Native token on eip155:8453/slip44:60";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:8453/slip44:60"]);
  });

  it("should extract multiple CAIP-19 URIs", () => {
    const content = `
      Multiple tokens:
      - ERC20: eip155:1/erc20:0x1234567890123456789012345678901234567890
      - NFT: eip155:1/erc721:0xabcdef1234567890123456789012345678901234/123
      - Native: eip155:8453/slip44:60
    `;
    const result = extractCAIP19URIs(content);
    expect(result).toEqual([
      "eip155:1/erc20:0x1234567890123456789012345678901234567890",
      "eip155:1/erc721:0xabcdef1234567890123456789012345678901234/123",
      "eip155:8453/slip44:60",
    ]);
  });

  it("should handle duplicate URIs", () => {
    const content = `
      Token eip155:1/erc20:0x1234567890123456789012345678901234567890
      Again: eip155:1/erc20:0x1234567890123456789012345678901234567890
    `;
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc20:0x1234567890123456789012345678901234567890"]);
  });

  it("should handle mixed case addresses", () => {
    const content = "Token: eip155:1/erc20:0xAbCdEf1234567890123456789012345678901234";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc20:0xAbCdEf1234567890123456789012345678901234"]);
  });

  it("should not extract invalid URIs", () => {
    const content = `
      Invalid: eip155:abc/erc20:0x123
      Also invalid: eip155:1/invalid:0x1234567890123456789012345678901234567890
      Not a URI: eip155:1
    `;
    const result = extractCAIP19URIs(content);
    expect(result).toEqual([]);
  });

  it("should extract URIs at start and end of text", () => {
    const content =
      "eip155:1/erc20:0x1234567890123456789012345678901234567890 at start and at end eip155:8453/slip44:60";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc20:0x1234567890123456789012345678901234567890", "eip155:8453/slip44:60"]);
  });

  it("should handle empty content", () => {
    const result = extractCAIP19URIs("");
    expect(result).toEqual([]);
  });

  it("should handle content without URIs", () => {
    const content = "Just regular text without any CAIP-19 URIs";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual([]);
  });

  it("should extract ERC1155 URIs", () => {
    const content = "Multi-token: eip155:1/erc1155:0x1234567890123456789012345678901234567890/456";
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/erc1155:0x1234567890123456789012345678901234567890/456"]);
  });

  it("should handle various SLIP-44 coin types", () => {
    const content = `
      Ethereum: eip155:1/slip44:60
      Bitcoin: eip155:1/slip44:0
      Litecoin: eip155:1/slip44:2
    `;
    const result = extractCAIP19URIs(content);
    expect(result).toEqual(["eip155:1/slip44:60", "eip155:1/slip44:0", "eip155:1/slip44:2"]);
  });
});

describe("resolveTokenMetadataFromContent", () => {
  it("should resolve SLIP-44 token metadata", async () => {
    const content = "Native token on eip155:8453/slip44:60";
    const result = await resolveTokenMetadataFromContent(content);

    expect(result["eip155:8453/slip44:60"]).toEqual({
      symbol: "ETH",
      name: "Ethereum",
      address: "native",
      chainId: 8453,
    });
  });

  it("should resolve multiple SLIP-44 tokens", async () => {
    const content = `
      Ethereum: eip155:1/slip44:60
      Bitcoin: eip155:1/slip44:0
    `;
    const result = await resolveTokenMetadataFromContent(content);

    expect(result["eip155:1/slip44:60"]).toEqual({
      symbol: "ETH",
      name: "Ethereum",
      address: "native",
      chainId: 1,
    });

    expect(result["eip155:1/slip44:0"]).toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      address: "native",
      chainId: 1,
    });
  });

  it("should handle unknown SLIP-44 coin types", async () => {
    const content = "Unknown: eip155:1/slip44:999999999";
    const result = await resolveTokenMetadataFromContent(content);

    expect(result["eip155:1/slip44:999999999"]).toBeUndefined();
  });

  it("should handle empty content", async () => {
    const result = await resolveTokenMetadataFromContent("");
    expect(result).toEqual({});
  });
});
