import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";

describe("complete parseLinks + replaceHandles flow", () => {
  it("should handle all types in the user's example", () => {
    const input = `handles testerino 
kualta.eth 
@kualta.eth
jesse.xyz
@jesse.xyz
https://example.com
example.com 
example.com/@kualta.eth 
0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7
@0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7`;

    const result = parseContent(input).parseLinks().replaceHandles().toString();

    // Check handles are converted
    expect(result).toContain("[kualta.eth](http://localhost:3010/u/kualta.eth)");
    expect(result).toContain("[jesse.xyz](http://localhost:3010/u/jesse.xyz)");

    // Check URLs are converted
    expect(result).toContain("[example.com](https://example.com)");
    expect(result).toContain("[example.com/@kualta.eth](https://example.com/@kualta.eth)");

    // Check addresses are converted
    expect(result).toContain(
      "[0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7](http://localhost:3010/u/0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7)",
    );

    // Check that the @ inside URL is preserved
    expect(result).not.toContain("example.com/[kualta.eth]");
  });

  it("should correctly parse a realistic post", () => {
    const input = `Check out my profile at example.com/@alice.eth

Also follow @bob.eth and visit alice.xyz for more info.

My address: 0x1234567890123456789012345678901234567890

Some links:
- https://github.com/user/repo
- example.org
- test.com/@username`;

    const result = parseContent(input).parseLinks().replaceHandles().toString();

    // Verify each conversion
    expect(result).toContain("[example.com/@alice.eth](https://example.com/@alice.eth)");
    expect(result).toContain("[bob.eth](http://localhost:3010/u/bob.eth)");
    expect(result).toContain("[alice.xyz](http://localhost:3010/u/alice.xyz)");
    expect(result).toContain(
      "[0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890)",
    );
    expect(result).toContain("[github.com/user/repo](https://github.com/user/repo)");
    expect(result).toContain("[example.org](https://example.org)");
    expect(result).toContain("[test.com/@username](https://test.com/@username)");
  });
});
