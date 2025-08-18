import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";

describe("Markdown and parseContent integration", () => {
  it("should convert @alice.eth to markdown link without @ in display", () => {
    const input = "Hey @alice.eth, check this out!";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe("Hey [alice.eth](http://localhost:3010/u/alice.eth), check this out!");
  });

  it("should convert standalone alice.eth to markdown link", () => {
    const input = "alice.eth posted a new article";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe("[alice.eth](http://localhost:3010/u/alice.eth) posted a new article");
  });

  it("should handle subnames correctly", () => {
    const input = "@alice.base.eth and bob.base.eth are friends";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe(
      "[alice.base.eth](http://localhost:3010/u/alice.base.eth) and [bob.base.eth](http://localhost:3010/u/bob.base.eth) are friends",
    );
  });

  it("should handle addresses correctly", () => {
    const input = "@0x1234567890123456789012345678901234567890 sent tokens";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe(
      "[0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) sent tokens",
    );
  });

  it("should not modify handles in URLs", () => {
    const input = "Check out https://zora.co/@yanayatsuk for art";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe("Check out https://zora.co/@yanayatsuk for art");
  });

  it("should handle mixed content", () => {
    const input = "@vitalik.eth mentioned alice.base.eth in https://example.com/@test";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe(
      "[vitalik.eth](http://localhost:3010/u/vitalik.eth) mentioned [alice.base.eth](http://localhost:3010/u/alice.base.eth) in https://example.com/@test",
    );
  });

  describe("markdown link format for UserLazyHandle", () => {
    it("should generate correct markdown for recognized handles", () => {
      const cases = [
        { input: "@alice.eth", expected: "[alice.eth](http://localhost:3010/u/alice.eth)" },
        { input: "alice.eth", expected: "[alice.eth](http://localhost:3010/u/alice.eth)" },
        { input: "@alice.base.eth", expected: "[alice.base.eth](http://localhost:3010/u/alice.base.eth)" },
        { input: "@alice.xyz", expected: "[alice.xyz](http://localhost:3010/u/alice.xyz)" },
        { input: "@alice.id", expected: "[alice.id](http://localhost:3010/u/alice.id)" },
        { input: "@alice.lens", expected: "[alice.lens](http://localhost:3010/u/alice.lens)" },
      ];

      cases.forEach((testCase) => {
        const result = parseContent(testCase.input).replaceHandles().toString();
        expect(result).toBe(testCase.expected);
      });
    });
  });
});
