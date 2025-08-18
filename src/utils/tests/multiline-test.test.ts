import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";

describe("multiline markdown parsing", () => {
  it("should handle the exact user example", () => {
    const input = `handles testerino 
kualta.eth 
@kualta.eth
jesse.xyz
@jesse.xyz
https://example.com
example.com 
example.com/@kualta.eth 
0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7
@0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7
0xbrokenbeef
0x0xDeAd010d1c8f9B463F5dE853902761Cdbac53fb7brokenbeef`;

    // Test parseLinks only
    const linksOnly = parseContent(input).parseLinks().toString();
    console.log("After parseLinks:");
    console.log(linksOnly);
    console.log("");

    // Test replaceHandles only
    const handlesOnly = parseContent(input).replaceHandles().toString();
    console.log("After replaceHandles:");
    console.log(handlesOnly);
    console.log("");

    // Test both operations
    const result = parseContent(input).parseLinks().replaceHandles().toString();
    console.log("After both:");
    console.log(result);

    // Check that example.com is converted to a link
    expect(linksOnly).toContain("[example.com](https://example.com)");
    expect(linksOnly).toContain("[example.com/@kualta.eth](https://example.com/@kualta.eth)");
  });

  it("should parse example.com on its own line", () => {
    const input = "example.com";
    const result = parseContent(input).parseLinks().toString();
    console.log(`Input: "${input}"`);
    console.log(`Result: "${result}"`);
    expect(result).toBe("[example.com](https://example.com)");
  });

  it("should parse example.com with spaces", () => {
    const input = "example.com ";
    const result = parseContent(input).parseLinks().toString();
    console.log(`Input: "${input}"`);
    console.log(`Result: "${result}"`);
    expect(result).toBe("[example.com](https://example.com) ");
  });
});
