import { getBaseUrl } from "./getBaseUrl";

class ContentParser {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  replaceHandles(): ContentParser {
    if (!this.content) return this;
    const BASE_URL = getBaseUrl();

    // Process content in a single pass to handle all cases
    // This regex matches:
    // 1. @username or @username.eth
    // 2. @0xaddress (40 hex chars)
    // 3. Standalone username.eth (when not preceded by @ or alphanumeric)
    // 4. Standalone 0xaddress (when not preceded by @ or alphanumeric)

    // First, let's handle @ mentions
    this.content = this.content.replace(
      /@(\w+(?:\.eth)?|0x[a-fA-F0-9]{40})\b/g,
      (match, handle, offset, fullString) => {
        // Check if we're already inside a markdown link
        const beforeText = fullString.substring(Math.max(0, offset - 10), offset);
        if (beforeText.includes("[")) {
          return match;
        }

        // Validate handle exists and is not empty
        if (!handle || handle.trim() === "") {
          return match; // Return original if invalid
        }
        return `[${match}](${BASE_URL}/u/${handle})`;
      },
    );

    // Then handle standalone ENS names and addresses
    // Use word boundary at start to avoid matching inside other words
    this.content = this.content.replace(
      /\b((?:\w+\.eth)|(?:0x[a-fA-F0-9]{40}))\b/g,
      (match, handle, offset, fullString) => {
        // Check if this is already inside a markdown link
        const beforeText = fullString.substring(Math.max(0, offset - 50), offset);
        const afterText = fullString.substring(offset, Math.min(fullString.length, offset + 50));

        // Skip if inside markdown link syntax [...](...)
        if (beforeText.includes("[") && afterText.includes("](")) {
          return match;
        }

        // Skip if preceded by @ (already handled above)
        if (offset > 0 && fullString[offset - 1] === "@") {
          return match;
        }

        // Skip if preceded by / (part of URL)
        if (offset > 0 && fullString[offset - 1] === "/") {
          return match;
        }

        // Skip if preceded by : (part of CAIP-19 URI)
        if (offset > 0 && fullString[offset - 1] === ":") {
          return match;
        }

        return `[@${handle}](${BASE_URL}/u/${handle})`;
      },
    );

    return this;
  }

  parseLinks(): ContentParser {
    const linkRegex = /<?((?:https?:\/\/|www\.)?[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}(?:\/[^\s<>*_~`]*)?)>?/gi;
    this.content = this.content.replace(linkRegex, (match, link, offset, fullString) => {
      // Skip if we're already inside a markdown link
      const beforeText = fullString.substring(Math.max(0, offset - 10), offset);
      if (beforeText.includes("[") || beforeText.includes("](")) {
        return match;
      }

      // Skip .eth domains as they are handled by replaceHandles
      if (link.endsWith(".eth")) {
        return match;
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
