import { describe, expect, it } from "bun:test";
import { parseContent } from "../parseContent";
import { processMediaContent } from "../ecp/converters/commentConverter";
import { extractUrlsFromText } from "../../components/Markdown";

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

describe("processMediaContent", () => {
  it("should convert IPFS URLs to markdown images", () => {
    const input = "Check this out!\n\nipfs://QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ";
    const result = processMediaContent(input);
    expect(result).toBe(
      "Check this out!\n\n![](https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ)",
    );
  });

  it("should convert lens:// URLs to markdown images", () => {
    const input = "My image: lens://4f4d42d8021b17b6e51f43c2baa14c8d8baf96cfaddbcad36fdfb8ac0c88eb73";
    const result = processMediaContent(input);
    expect(result).toBe(
      "My image: ![](https://api.grove.storage/4f4d42d8021b17b6e51f43c2baa14c8d8baf96cfaddbcad36fdfb8ac0c88eb73)",
    );
  });

  it("should handle multiple IPFS URLs", () => {
    const input = "First ipfs://Qm123abc then ipfs://Qm456def";
    const result = processMediaContent(input);
    expect(result).toBe("First ![](https://ipfs.io/ipfs/Qm123abc) then ![](https://ipfs.io/ipfs/Qm456def)");
  });

  it("should handle multiple lens:// URLs", () => {
    const input = "lens://image1.jpg and lens://image2.png";
    const result = processMediaContent(input);
    expect(result).toBe("![](https://api.grove.storage/image1.jpg) and ![](https://api.grove.storage/image2.png)");
  });

  it("should handle mixed IPFS and lens:// URLs", () => {
    const input = "ipfs://Qm123 mixed with lens://test/file.jpg";
    const result = processMediaContent(input);
    expect(result).toBe("![](https://ipfs.io/ipfs/Qm123) mixed with ![](https://api.grove.storage/test/file.jpg)");
  });

  it("should handle lens:// URLs with paths", () => {
    const input = "lens://path/to/nested/file.png";
    const result = processMediaContent(input);
    expect(result).toBe("![](https://api.grove.storage/path/to/nested/file.png)");
  });

  it("should handle lens:// URLs with hyphens and underscores", () => {
    const input = "lens://my-file_name-123.jpg";
    const result = processMediaContent(input);
    expect(result).toBe("![](https://api.grove.storage/my-file_name-123.jpg)");
  });

  it("should not modify text without media URLs", () => {
    const input = "Just regular text without any special URLs";
    const result = processMediaContent(input);
    expect(result).toBe(input);
  });

  it("should handle empty content", () => {
    const input = "";
    const result = processMediaContent(input);
    expect(result).toBe("");
  });

  it("should handle content with media URLs at the beginning", () => {
    const input = "ipfs://QmStart at the beginning";
    const result = processMediaContent(input);
    expect(result).toBe("![](https://ipfs.io/ipfs/QmStart) at the beginning");
  });

  it("should handle content with media URLs at the end", () => {
    const input = "At the end ipfs://QmEnd";
    const result = processMediaContent(input);
    expect(result).toBe("At the end ![](https://ipfs.io/ipfs/QmEnd)");
  });

  it("should preserve newlines and whitespace", () => {
    const input = "Before\n\n  ipfs://Qm123  \n\nAfter";
    const result = processMediaContent(input);
    expect(result).toBe("Before\n\n  ![](https://ipfs.io/ipfs/Qm123)  \n\nAfter");
  });
});

describe("extractUrlsFromText", () => {
  it("should exclude markdown image URLs", () => {
    const input = "![](https://example.com/image.jpg)";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should exclude IPFS URLs", () => {
    const input = "Check this https://ipfs.io/ipfs/QmXyz123";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should exclude Grove Storage URLs", () => {
    const input = "Image at https://api.grove.storage/some-file.jpg";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should include regular URLs", () => {
    const input = "Visit https://example.com for more info";
    const result = extractUrlsFromText(input);
    expect(result).toEqual(["https://example.com"]);
  });

  it("should exclude markdown link URLs", () => {
    const input = "[Click here](https://example.com)";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should handle multiple URLs with mixed exclusions", () => {
    const input = "Regular https://example.com and ![](https://ipfs.io/ipfs/Qm123) and [link](https://test.com)";
    const result = extractUrlsFromText(input);
    expect(result).toEqual(["https://example.com"]);
  });

  it("should exclude localhost URLs", () => {
    const input = "Local link http://localhost:3010/u/test";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should handle URLs with trailing punctuation", () => {
    const input = "Check https://example.com. Also https://test.org!";
    const result = extractUrlsFromText(input);
    expect(result).toEqual(["https://example.com", "https://test.org"]);
  });

  it("should deduplicate URLs", () => {
    const input = "First https://example.com then again https://example.com";
    const result = extractUrlsFromText(input);
    expect(result).toEqual(["https://example.com"]);
  });

  it("should handle empty text", () => {
    const input = "";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should handle text without URLs", () => {
    const input = "Just plain text without any URLs";
    const result = extractUrlsFromText(input);
    expect(result).toEqual([]);
  });

  it("should handle complex markdown with IPFS images", () => {
    const input = `
      Here's my post with an image:
      ![](https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ)
      
      And a regular link: https://example.com
      Plus a markdown link: [click](https://test.com)
    `;
    const result = extractUrlsFromText(input);
    expect(result).toEqual(["https://example.com"]);
  });
});
