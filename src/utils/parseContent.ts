import { getBaseUrl } from "./getBaseUrl";

class ContentParser {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  replaceHandles(): ContentParser {
    if (!this.content) return this;
    const BASE_URL = getBaseUrl();

    const ensLikeTLDs = "eth|xyz|id|art|dao|nft|lens|crypto|wallet|ens|sol|bnb";

    // First, handle @ mentions with ENS-like domains
    // Use negative lookbehind to avoid matching inside URLs
    // (?<![\w\.\/]) means not preceded by word char, dot, or slash
    const mentionRegex = new RegExp(
      `(?<![\\/\\w.])@([\\w-]+(?:\\.[\\w-]+)*\\.(${ensLikeTLDs})|0x[a-fA-F0-9]{40})\\b`,
      "gi",
    );

    this.content = this.content.replace(mentionRegex, (_match, handle) => {
      return `[${handle}](${BASE_URL}/u/${handle})`;
    });

    // Then handle standalone ENS names and addresses
    // Use negative lookbehind to avoid matching if preceded by [@/\[: or word.-]
    // Use negative lookahead to avoid matching if followed by ]
    const standaloneRegex = new RegExp(
      `(?<![@\\/\\[\\w.:-])\\b([\\w-]+(?:\\.[\\w-]+)*\\.(${ensLikeTLDs})|0x[a-fA-F0-9]{40})\\b(?!\\])`,
      "gi",
    );

    this.content = this.content.replace(standaloneRegex, (_match, handle) => {
      return `[${handle}](${BASE_URL}/u/${handle})`;
    });

    return this;
  }

  parseLinks(): ContentParser {
    // Match URLs - including those without protocol but with clear domain structure
    // Stop at common punctuation that typically ends URLs
    const linkRegex = /<?((?:https?:\/\/|www\.)?[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}(?:\/[^\s<>*~`,;!)"]*)?)>?/gi;
    this.content = this.content.replace(linkRegex, (match, link, offset, fullString) => {
      // Skip if we're already inside a markdown link
      const beforeText = fullString.substring(Math.max(0, offset - 10), offset);
      if (beforeText.includes("[") || beforeText.includes("](")) {
        return match;
      }

      // Skip localhost URLs
      if (link.includes("localhost")) {
        return match;
      }

      // Skip if this is just a standalone ENS domain without a path
      // (these should be handled by replaceHandles as user handles)
      const ensLikeTLDs = ["eth", "xyz", "id", "art", "dao", "nft", "lens", "crypto", "wallet", "ens", "sol", "bnb"];
      const cleanLink = link.replace(/^(https?:\/\/)?(www\.)?/, "");
      const parts = cleanLink.split("/");
      const domain = parts[0];
      const hasPath = parts.length > 1 && parts[1] !== "";

      // Only skip if it's a bare ENS domain with no path
      if (!hasPath && ensLikeTLDs.some((tld) => domain.endsWith(`.${tld}`))) {
        // Check if it looks like a username (simple word.tld pattern)
        if (/^[\w-]+\.[\w]+$/.test(domain)) {
          return match; // Let replaceHandles handle this as a user handle
        }
      }

      const url = link.startsWith("http") ? link : `https://${link}`;

      // Skip image URLs
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url) || url.includes("api.grove.storage");
      if (isImage) {
        return match;
      }

      const linkWithoutProtocol = link.replace(/^https?:\/\//, "");
      return `[${linkWithoutProtocol}](${url})`;
    });
    return this;
  }

  toString(): string {
    return this.content;
  }
}

export function parseContent(content: string): ContentParser {
  return new ContentParser(content);
}
