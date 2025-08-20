import { describe, expect, it } from "bun:test";
import { extractUrlsFromText } from "../../components/Markdown";
import { extractConsecutiveMedia } from "../../components/MarkdownMedia";
import { processMediaContent } from "../ecp/converters/commentConverter";
import { parseContent } from "../parseContent";

describe("parseContent", () => {
  describe("replaceHandles", () => {
    it("should replace @username.eth mentions with markdown links (keeping @ in display)", () => {
      const input = "anyone familiar with this address @vitalik.eth ? curious";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "anyone familiar with this address [@vitalik.eth](http://localhost:3010/u/vitalik.eth) ? curious",
      );
    });

    it("should NOT replace @username mentions without domain", () => {
      const input = "hey @alice check this out";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("hey @alice check this out");
    });

    it("should NOT replace @username.com mentions (not ENS-like)", () => {
      const input = "contact @alice.com for info";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("contact @alice.com for info");
    });

    it("should replace @username.xyz mentions", () => {
      const input = "follow @alice.xyz on chain";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("follow [@alice.xyz](http://localhost:3010/u/alice.xyz) on chain");
    });

    it("should replace @username.base.eth subname mentions", () => {
      const input = "message @alice.base.eth about this";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("message [@alice.base.eth](http://localhost:3010/u/alice.base.eth) about this");
    });

    it("should replace standalone subnames like alice.base.eth", () => {
      const input = "alice.base.eth just posted";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("[alice.base.eth](http://localhost:3010/u/alice.base.eth) just posted");
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
      expect(result).toBe("check out [vitalik.eth](http://localhost:3010/u/vitalik.eth) profile");
    });

    it("should replace standalone ethereum addresses", () => {
      const input = "address 0x1234567890123456789012345678901234567890 has activity";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "address [0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) has activity",
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
      const input = "already linked [test.eth](http://localhost:3010/u/test.eth) should not change";
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

    it("should not replace @handles inside URLs", () => {
      const input = "check https://zora.co/@yanayatsuk for more info";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("check https://zora.co/@yanayatsuk for more info");
    });

    it("should not replace ENS names inside URLs", () => {
      const input = "visit https://example.com/user/vitalik.eth for profile";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("visit https://example.com/user/vitalik.eth for profile");
    });

    it("should handle the zora.co/@yanayatsuk case correctly", () => {
      const input = "https://zora.co/@yanayatsuk (Instagram verified)";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("https://zora.co/@yanayatsuk (Instagram verified)");
    });

    it("should not replace @handles without domain outside of URLs", () => {
      const input = "@username without domain stays as is";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("@username without domain stays as is");
    });

    it("should replace @handle.eth correctly", () => {
      const input = "Follow @vitalik.eth for updates";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Follow [@vitalik.eth](http://localhost:3010/u/vitalik.eth) for updates");
    });

    it("should handle mixed content with URLs and mentions", () => {
      const input = "Check https://zora.co/@artist and follow @vitalik.eth";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "Check https://zora.co/@artist and follow [@vitalik.eth](http://localhost:3010/u/vitalik.eth)",
      );
    });

    it("should not replace handles in http URLs", () => {
      const input = "Visit http://example.com/@user for more";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Visit http://example.com/@user for more");
    });

    it("should handle standalone .eth names at start of sentence", () => {
      const input = "vitalik.eth posted a new article";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("[vitalik.eth](http://localhost:3010/u/vitalik.eth) posted a new article");
    });

    it("should handle standalone .eth names at end of sentence", () => {
      const input = "Article written by vitalik.eth";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Article written by [vitalik.eth](http://localhost:3010/u/vitalik.eth)");
    });

    it("should not replace partial matches in URLs", () => {
      const input = "See https://app.ens.domains/name/nick.eth for ENS details";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("See https://app.ens.domains/name/nick.eth for ENS details");
    });

    it("should handle multiple URLs with @ symbols", () => {
      const input = "https://twitter.com/@user and https://instagram.com/@artist are different";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("https://twitter.com/@user and https://instagram.com/@artist are different");
    });

    it("should not split example.com/@kualta.eth into two links", () => {
      const input = "Visit example.com/@kualta.eth for profile";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Visit example.com/@kualta.eth for profile");
    });

    it("should not split www.example.com/@user.eth", () => {
      const input = "Check www.example.com/@user.eth";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Check www.example.com/@user.eth");
    });

    it("should handle mixed URL formats with @ in path", () => {
      const input = "Links: https://site.com/@alice.eth and example.com/@bob.eth";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("Links: https://site.com/@alice.eth and example.com/@bob.eth");
    });

    it("should handle complex subnames with multiple levels", () => {
      const input = "contact @sub.alice.base.eth or sub.alice.base.eth";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "contact [@sub.alice.base.eth](http://localhost:3010/u/sub.alice.base.eth) or [sub.alice.base.eth](http://localhost:3010/u/sub.alice.base.eth)",
      );
    });

    it("should handle various ENS TLDs", () => {
      const input = "@user.xyz @user.id @user.art @user.dao @user.nft";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe(
        "[@user.xyz](http://localhost:3010/u/user.xyz) [@user.id](http://localhost:3010/u/user.id) [@user.art](http://localhost:3010/u/user.art) [@user.dao](http://localhost:3010/u/user.dao) [@user.nft](http://localhost:3010/u/user.nft)",
      );
    });

    it("should not replace common file extensions", () => {
      const input = "file.txt image.png document.pdf";
      const result = parseContent(input).replaceHandles().toString();
      expect(result).toBe("file.txt image.png document.pdf");
    });

    describe("display format with @ symbol preservation", () => {
      it("should display @vitalik.eth as @vitalik.eth in link text", () => {
        const input = "@vitalik.eth posted";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe("[@vitalik.eth](http://localhost:3010/u/vitalik.eth) posted");
      });

      it("should display standalone vitalik.eth as vitalik.eth in link text", () => {
        const input = "vitalik.eth posted";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe("[vitalik.eth](http://localhost:3010/u/vitalik.eth) posted");
      });

      it("should display @alice.base.eth subname with @ in link text", () => {
        const input = "@alice.base.eth commented";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe("[@alice.base.eth](http://localhost:3010/u/alice.base.eth) commented");
      });

      it("should display standalone alice.base.eth without @ in link text", () => {
        const input = "alice.base.eth commented";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe("[alice.base.eth](http://localhost:3010/u/alice.base.eth) commented");
      });

      it("should display @0xaddress with @ in link text", () => {
        const input = "@0x1234567890123456789012345678901234567890 sent";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe(
          "[@0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) sent",
        );
      });

      it("should display standalone 0xaddress without @ in link text", () => {
        const input = "0x1234567890123456789012345678901234567890 sent";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe(
          "[0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890) sent",
        );
      });

      it("should handle multiple @ mentions all with @ in display", () => {
        const input = "@alice.eth and @bob.base.eth and @0x1234567890123456789012345678901234567890";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe(
          "[@alice.eth](http://localhost:3010/u/alice.eth) and [@bob.base.eth](http://localhost:3010/u/bob.base.eth) and [@0x1234567890123456789012345678901234567890](http://localhost:3010/u/0x1234567890123456789012345678901234567890)",
        );
      });

      it("should handle mixed @ mentions and standalone names", () => {
        const input = "@alice.eth mentioned bob.eth";
        const result = parseContent(input).replaceHandles().toString();
        expect(result).toBe(
          "[@alice.eth](http://localhost:3010/u/alice.eth) mentioned [bob.eth](http://localhost:3010/u/bob.eth)",
        );
      });
    });
  });

  describe("parseLinks", () => {
    it("should convert URLs to markdown links", () => {
      const input = "check out https://example.com for more";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("check out [example.com](https://example.com) for more");
    });

    it("should convert bare domain URLs to markdown links", () => {
      const input = "visit example.com today";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("visit [example.com](https://example.com) today");
    });

    it("should convert URLs with @ in path to markdown links", () => {
      const input = "check example.com/@kualta.eth for profile";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("check [example.com/@kualta.eth](https://example.com/@kualta.eth) for profile");
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

    it("should NOT convert standalone ENS domains", () => {
      const input = "alice.eth posted something";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe(input); // Should not be converted by parseLinks
    });

    it("should convert ENS domains with paths", () => {
      const input = "visit alice.eth/profile for more";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("visit [alice.eth/profile](https://alice.eth/profile) for more");
    });

    it("should handle Twitter/X.com URLs with query parameters", () => {
      const input = "check x.com/danqing_liu/status/1957533865607680482?s=46 for details";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe(
        "check [x.com/danqing_liu/status/1957533865607680482?s=46](https://x.com/danqing_liu/status/1957533865607680482?s=46) for details",
      );
    });

    it("should handle Twitter URLs with multiple query parameters", () => {
      const input = "see twitter.com/user/status/123456?s=20&t=abc123xyz";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe(
        "see [twitter.com/user/status/123456?s=20&t=abc123xyz](https://twitter.com/user/status/123456?s=20&t=abc123xyz)",
      );
    });

    it("should handle URLs with query parameters and hash fragments", () => {
      const input = "visit example.com/page?param=value#section";
      const result = parseContent(input).parseLinks().toString();
      expect(result).toBe("visit [example.com/page?param=value#section](https://example.com/page?param=value#section)");
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

    it("should convert URL with @ in path to single link when parseLinks is called", () => {
      const input = "Visit example.com/@kualta.eth for profile";
      const result = parseContent(input).parseLinks().replaceHandles().toString();
      expect(result).toBe("Visit [example.com/@kualta.eth](https://example.com/@kualta.eth) for profile");
    });

    it("should handle parseLinks then replaceHandles correctly", () => {
      const input = "Check example.com/@alice.eth and @bob.eth";
      const result = parseContent(input).parseLinks().replaceHandles().toString();
      expect(result).toBe(
        "Check [example.com/@alice.eth](https://example.com/@alice.eth) and [@bob.eth](http://localhost:3010/u/bob.eth)",
      );
    });
  });
});

describe("processMediaContent", () => {
  it("should convert IPFS URLs to markdown images", async () => {
    const input = "Check this out!\n\nipfs://QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/QmVaWS1L9jLDuuU5t8Xbnst8eRhue2qev6c8svHjxMjjrZ)");
  });

  it("should convert lens:// URLs to markdown images", async () => {
    const input = "My image: lens://4f4d42d8021b17b6e51f43c2baa14c8d8baf96cfaddbcad36fdfb8ac0c88eb73";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain(
      "](https://api.grove.storage/4f4d42d8021b17b6e51f43c2baa14c8d8baf96cfaddbcad36fdfb8ac0c88eb73)",
    );
  });

  it("should handle multiple IPFS URLs", async () => {
    const input = "First ipfs://Qm123abc then ipfs://Qm456def";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/Qm123abc)");
    expect(result.content).toContain("](https://ipfs.io/ipfs/Qm456def)");
  });

  it("should handle multiple lens:// URLs", async () => {
    const input = "lens://image1.jpg and lens://image2.png";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://api.grove.storage/image1.jpg)");
    expect(result.content).toContain("](https://api.grove.storage/image2.png)");
  });

  it("should handle mixed IPFS and lens:// URLs", async () => {
    const input = "ipfs://Qm123 mixed with lens://test/file.jpg";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/Qm123)");
    expect(result.content).toContain("](https://api.grove.storage/test/file.jpg)");
  });

  it("should handle lens:// URLs with paths", async () => {
    const input = "lens://path/to/nested/file.png";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://api.grove.storage/path/to/nested/file.png)");
  });

  it("should handle lens:// URLs with hyphens and underscores", async () => {
    const input = "lens://my-file_name-123.jpg";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://api.grove.storage/my-file_name-123.jpg)");
  });

  it("should not modify text without media URLs", async () => {
    const input = "Just regular text without any special URLs";
    const result = await processMediaContent(input);
    expect(result.content).toBe(input);
  });

  it("should handle empty content", async () => {
    const input = "";
    const result = await processMediaContent(input);
    expect(result.content).toBe("");
  });

  it("should handle content with media URLs at the beginning", async () => {
    const input = "ipfs://QmStart at the beginning";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/QmStart)");
  });

  it("should handle content with media URLs at the end", async () => {
    const input = "At the end ipfs://QmEnd";
    const result = await processMediaContent(input);
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/QmEnd)");
  });

  it("should preserve newlines and whitespace", async () => {
    const input = "Before\n\n  ipfs://Qm123  \n\nAfter";
    const result = await processMediaContent(input);
    expect(result.content).toContain("Before");
    expect(result.content).toContain("![");
    expect(result.content).toContain("](https://ipfs.io/ipfs/Qm123)");
    expect(result.content).toContain("After");
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
    expect(result.processedContent).toContain("MEDIA_GALLERY_PLACEHOLDER_0");
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
    expect(result.processedContent).toContain("MEDIA_GALLERY_PLACEHOLDER_0");
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
    expect(result.processedContent).not.toContain("MEDIA_GALLERY_PLACEHOLDER");
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
    expect(result.processedContent).toContain("MEDIA_GALLERY_PLACEHOLDER_0");
    expect(result.processedContent).toContain("MEDIA_GALLERY_PLACEHOLDER_1");
    expect(result.processedContent).toContain("Middle text");
  });

  it("should handle images with alt text", () => {
    const content = `![Alt text 1](https://example.com/1.jpg)
![Alt text 2](https://example.com/2.jpg)`;

    const result = extractConsecutiveMedia(content);

    expect(result.mediaGroups).toHaveLength(1);
    expect(result.mediaGroups[0]).toEqual(["https://example.com/1.jpg", "https://example.com/2.jpg"]);
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
      "https://example.com/another.png",
    ]);
    expect(result.processedContent).toContain("MEDIA_GALLERY_PLACEHOLDER_0");
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
