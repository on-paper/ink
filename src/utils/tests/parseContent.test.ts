import { describe, expect, it } from "bun:test";
import { extractUrlsFromText } from "../../components/Markdown";
import { extractConsecutiveMedia } from "../../components/MarkdownMediaGallery";
import { processMediaContent } from "../ecp/converters/commentConverter";
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

describe("processMediaContent", () => {
  it("should convert IPFS URLs to markdown images", () => {
    const input = "Check this out!\n\nipfs://QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ";
    const result = processMediaContent(input);
    expect(result).toBe("Check this out!\n\n![](https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ)");
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

describe("extractConsecutiveMedia", () => {
  it("should group two consecutive images into a gallery", () => {
    const content = `Some text before

![](https://api.grove.storage/image1.jpg)
![](https://api.grove.storage/image2.jpg)

Some text after`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0]).toEqual([
      "https://api.grove.storage/image1.jpg",
      "https://api.grove.storage/image2.jpg",
    ]);
    expect(result.processedContent).toContain('MEDIA_GALLERY_PLACEHOLDER_0');
    expect(result.processedContent).toContain("Some text before");
    expect(result.processedContent).toContain("Some text after");
  });

  it("should group three consecutive images with empty lines between them", () => {
    const content = `Text before

![](https://api.grove.storage/76bcc7f1c8e3011a235ac329cf1806eb1fa3a41a710a973bd79070aec733d4cf)

![](https://api.grove.storage/4a8af5e9bdc11943b657f38c6b498b04600fc1718eb6d0cac9f389bba573fe80)

![](https://api.grove.storage/third.jpg)

Text after`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0]).toHaveLength(3);
    expect(result.mediaGroups[0][2]).toEqual("https://api.grove.storage/third.jpg");
    expect(result.processedContent).toContain('MEDIA_GALLERY_PLACEHOLDER_0');
  });

  it("should keep single images as standalone", () => {
    const content = `Single image:

![](https://api.grove.storage/single.jpg)

Some text

![](https://api.grove.storage/another.jpg)

More text`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(0);
    expect(result.processedContent).toContain("![](https://api.grove.storage/single.jpg)");
    expect(result.processedContent).toContain("![](https://api.grove.storage/another.jpg)");
    expect(result.processedContent).not.toContain('MEDIA_GALLERY_PLACEHOLDER');
  });

  it("should handle multiple gallery groups in one content", () => {
    const content = `First gallery:

![](https://example.com/1.jpg)
![](https://example.com/2.jpg)

Middle text

Second gallery:

![](https://example.com/3.jpg)
![](https://example.com/4.jpg)
![](https://example.com/5.jpg)

End text`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(2);
    expect(result.mediaGroups[0]).toHaveLength(2);
    expect(result.mediaGroups[1]).toHaveLength(3);
    expect(result.processedContent).toContain('MEDIA_GALLERY_PLACEHOLDER_0');
    expect(result.processedContent).toContain('MEDIA_GALLERY_PLACEHOLDER_1');
    expect(result.processedContent).toContain("Middle text");
  });

  it("should handle images with alt text", () => {
    const content = `![Alt text 1](https://example.com/1.jpg)
![Alt text 2](https://example.com/2.jpg)`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0]).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg"
    ]);
  });

  it("should handle empty content", () => {
    const content = "";
    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(0);
    expect(result.processedContent).toBe("");
  });

  it("should handle content with no images", () => {
    const content = "Just plain text without any images";
    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(0);
    expect(result.processedContent).toBe(content);
  });

  it("should handle IPFS image URLs in galleries", () => {
    const content = `![](https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ)
![](https://ipfs.io/ipfs/Qm123abc)`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0][0]).toBe("https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ");
    expect(result.mediaGroups[0][1]).toBe("https://ipfs.io/ipfs/Qm123abc");
  });

  it("should not group images separated by text", () => {
    const content = `![](https://example.com/1.jpg)
Some text between
![](https://example.com/2.jpg)`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(0);
    expect(result.processedContent).toContain("![](https://example.com/1.jpg)");
    expect(result.processedContent).toContain("Some text between");
    expect(result.processedContent).toContain("![](https://example.com/2.jpg)");
  });

  it("should preserve indentation and formatting", () => {
    const content = `  Indented text

![](https://example.com/1.jpg)
![](https://example.com/2.jpg)

    Code block or indented text`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.processedContent).toContain("  Indented text");
    expect(result.processedContent).toContain("    Code block or indented text");
  });

  it("should handle mixed media galleries with images and videos", () => {
    const content = `Mixed media:

![](https://example.com/image.jpg)
![](https://example.com/video.mp4)
![](https://example.com/another.png)

End`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0]).toEqual([
      "https://example.com/image.jpg",
      "https://example.com/video.mp4",
      "https://example.com/another.png"
    ]);
    expect(result.processedContent).toContain('MEDIA_GALLERY_PLACEHOLDER_0');
  });

  it("should extract URLs without determining type", () => {
    const content = `![](https://api.grove.storage/file1)
![](https://api.grove.storage/file2)`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0][0]).toBe("https://api.grove.storage/file1");
    expect(result.mediaGroups[0][1]).toBe("https://api.grove.storage/file2");
  });
});
