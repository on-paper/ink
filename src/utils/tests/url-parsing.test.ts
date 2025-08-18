import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";

describe("URL parsing with @ symbols", () => {
  it("should convert example.com to a link", () => {
    const input = "Visit example.com for more info";
    const result = parseContent(input).parseLinks().toString();
    expect(result).toBe("Visit [example.com](https://example.com) for more info");
  });

  it("should convert example.com/@kualta.eth to a single link", () => {
    const input = "Check out example.com/@kualta.eth for profile";
    const result = parseContent(input).parseLinks().toString();
    expect(result).toBe("Check out [example.com/@kualta.eth](https://example.com/@kualta.eth) for profile");
  });

  it("should not convert @kualta.eth inside URL when using replaceHandles", () => {
    const input = "Visit example.com/@kualta.eth for profile";
    const result = parseContent(input).replaceHandles().toString();
    expect(result).toBe("Visit example.com/@kualta.eth for profile");
  });

  it("should handle both operations correctly", () => {
    const input = "Visit example.com/@kualta.eth and follow @alice.eth";
    const result = parseContent(input).parseLinks().replaceHandles().toString();
    expect(result).toBe(
      "Visit [example.com/@kualta.eth](https://example.com/@kualta.eth) and follow [alice.eth](http://localhost:3010/u/alice.eth)",
    );
  });

  it("should handle complex examples", () => {
    const input = "Check example.com, example.com/@user, and @alice.eth";
    const result = parseContent(input).parseLinks().replaceHandles().toString();
    expect(result).toBe(
      "Check [example.com](https://example.com), [example.com/@user](https://example.com/@user), and [alice.eth](http://localhost:3010/u/alice.eth)",
    );
  });
});
