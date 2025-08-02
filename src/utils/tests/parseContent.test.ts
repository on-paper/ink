import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";

describe("parseContent", () => {
  describe("replaceHandles", () => {
    it("should replace @username.eth mentions with markdown links", () => {
      const input = "anyone familiar with this address @vitalik.eth ? curious";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "anyone familiar with this address [@vitalik.eth](http://localhost:3010/u/vitalik.eth) ? curious",
      );
    });

    it("should replace @username mentions without .eth", () => {
      const input = "hey @alice check this out";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("hey [@alice](http://localhost:3010/u/alice) check this out");
    });

    it("should replace @0xaddress mentions", () => {
      const input = "wallet @0x1234567890123456789012345678901234567890 is interesting";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "wallet [@0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) is interesting",
      );
    });

    it("should replace standalone ENS names", () => {
      const input = "check out vitalik.eth profile";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("check out [@vitalik.eth](http://localhost:3010/u/vitalik.eth) profile");
    });

    it("should replace standalone ethereum addresses", () => {
      const input = "address 0x1234567890123456789012345678901234567890 has activity";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "address [@0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) has activity",
      );
    });

    it("should handle multiple mentions in one text", () => {
      const input = "both @alice.eth and @bob.eth are here";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "both [@alice.eth](http://localhost:3010/u/alice.eth) and [@bob.eth](http://localhost:3010/u/bob.eth) are here",
      );
    });

    it("should not replace handles already in markdown links", () => {
      const input = "already linked [@test.eth](http://localhost:3010/u/test.eth) should not change";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(input);
    });

    it("should not replace handles in URLs", () => {
      const input = "url http://localhost:3010/u/test.eth should not change";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(input);
    });

    it("should handle @ symbol alone without crashing", () => {
      const input = "just an @ symbol here";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("just an @ symbol here");
    });

    it("should handle empty content", () => {
      const input = "";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("");
    });

    it("should not create links with undefined handles", () => {
      const input = "test @ alone and @";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).not.toContain("undefined");
      expect(result).toBe("test @ alone and @");
    });

    it("should handle content with existing CAIP-19 URIs", () => {
      const input = "check eip155:8453/erc20:0x1234567890123456789012345678901234567890";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(input); // CAIP-19 URIs should not be modified by handle parsing
    });
  });

  describe("parseLinks", () => {
    it("should convert URLs to markdown links", () => {
      const input = "check out https://example.com for more";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("check out [example.com](https://example.com) for more");
    });

    it("should handle www URLs", () => {
      const input = "visit www.example.com today";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("visit [www.example.com](https://www.example.com) today");
    });

    it("should skip image URLs", () => {
      const input = "image at https://example.com/image.png here";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe(input);
    });
  });

  describe("combined operations", () => {
    it("should handle both mentions and links", () => {
      const input = "hey @alice.eth check https://example.com out";
      const result = parseContent(input).replaceHandles().parseLinks().toString();
      expect(result).toBe(
        "hey [@alice.eth](http://localhost:3010/u/alice.eth) check [example.com](https://example.com) out",
      );
    });
  });
});
