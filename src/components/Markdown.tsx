"use client";

import type { PostMention } from "@cartel-sh/ui";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown/lib/ast-to-react";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { parseCAIP19URI } from "~/utils/caip19";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { getScanUrl } from "~/utils/getScanUrl";
import { parseContent } from "~/utils/parseContent";
import { LinkPreview } from "./embeds/LinkPreview";
import { extractConsecutiveMedia, MarkdownMediaGallery, MarkdownMediaItem } from "./MarkdownMedia";
import { UserLazyHandle } from "./user/UserLazyHandle";
import "~/components/composer/lexical.css";

const BASE_URL = getBaseUrl();

export const extractUrlsFromText = (text: string): string[] => {
  const uniqueUrls = new Map<string, string>();

  const urlRegex = /https?:\/\/[^\s<>"\])]+/gi;
  const allMatches = text.match(urlRegex) || [];

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const markdownUrls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkUrl = match[2].trim();
    markdownUrls.add(linkUrl);
  }

  while ((match = markdownImageRegex.exec(text)) !== null) {
    const imageUrl = match[2].trim();
    markdownUrls.add(imageUrl);
  }

  for (const rawUrl of allMatches) {
    const cleanUrl = rawUrl.replace(/[.,;:!?]+$/, "").trim();

    if (cleanUrl.startsWith(BASE_URL) || markdownUrls.has(cleanUrl)) {
      continue;
    }

    if (cleanUrl.includes("ipfs.io/ipfs/") || cleanUrl.includes("api.grove.storage/")) {
      continue;
    }

    try {
      const urlObj = new URL(cleanUrl);
      const normalizedUrl = urlObj.href;

      if (!uniqueUrls.has(normalizedUrl)) {
        uniqueUrls.set(normalizedUrl, cleanUrl);
      }
    } catch {
      // If URL parsing fails, skip it
    }
  }

  const result = Array.from(uniqueUrls.values());
  return result;
};

const Markdown: React.FC<{
  content: string;
  mentions?: PostMention[];
  className?: string;
  showLinkPreviews?: boolean;
  mediaMimeTypes?: Record<string, string>;
}> = ({ content, mentions, className = "", showLinkPreviews = false, mediaMimeTypes }) => {
  let processedText = content;

  processedText = parseContent(content).parseLinks().replaceHandles().toString();

  const { mediaGroups, processedContent } = useMemo(() => {
    return extractConsecutiveMedia(processedText);
  }, [processedText]);

  const colorClasses =
    className
      .split(" ")
      .filter((cls) => cls.includes("text-"))
      .join(" ") || "";

  const createCustomLink = (colorClasses: string, _mentions?: PostMention[]): Components["a"] => {
    return ({ node, ...props }) => {
      const { href, children } = props;

      // Handle CAIP-19 URIs (eip155 format)
      if (href?.match(/^eip155:\d+\/(erc20|erc721|erc1155):/)) {
        const components = parseCAIP19URI(href);
        if (components?.assetNamespace && components.assetReference && components.chainId) {
          const { assetNamespace, assetReference, chainId, tokenId } = components;
          const chainIdNum = typeof chainId === "string" ? Number.parseInt(chainId, 10) : chainId;

          // Generate appropriate scan URL
          let scanUrl: string;
          if (tokenId && (assetNamespace === "erc721" || assetNamespace === "erc1155")) {
            // For NFTs with token ID, link to the specific token
            scanUrl = `${getScanUrl(chainIdNum, "token", assetReference)}?a=${tokenId}`;
          } else {
            // For fungible tokens or collections
            scanUrl = getScanUrl(chainIdNum, "token", assetReference);
          }

          return (
            <a href={scanUrl} target="_blank" rel="noopener noreferrer" className={`lexical-link ${colorClasses}`}>
              {children || href}
            </a>
          );
        }
      }

      // Handle all user profile links (from parseContent)
      if (href?.startsWith(`${BASE_URL}/u/`)) {
        const handle = href.split("/u/")[1];
        if (handle) {
          return (
            <span className={`lexical-link ${colorClasses}`}>
              <UserLazyHandle handle={handle} />
            </span>
          );
        }
      }

      return (
        <a {...props} className={`lexical-link ${colorClasses}`}>
          {children}
        </a>
      );
    };
  };

  const createCustomImage = (mediaMimeTypes?: Record<string, string>): Components["img"] => {
    return ({ node, ...props }) => {
      const { src } = props;
      if (!src) return null;
      const mimeType = mediaMimeTypes?.[src];
      return <MarkdownMediaItem url={src} mimeType={mimeType} />;
    };
  };

  const components: Components = {
    p: ({ children }) => {
      // Check if this paragraph contains a media gallery placeholder
      // Children could be a string, array, or React element
      let textContent = "";

      if (typeof children === "string") {
        textContent = children;
      } else if (Array.isArray(children)) {
        // Check if any child is the gallery placeholder
        textContent = children.map((child) => (typeof child === "string" ? child : "")).join("");
      }

      if (textContent.includes("MEDIA_GALLERY_PLACEHOLDER_")) {
        const match = textContent.match(/MEDIA_GALLERY_PLACEHOLDER_(\d+)/);
        if (match) {
          const galleryIndex = Number.parseInt(match[1], 10);
          if (mediaGroups[galleryIndex]) {
            return <MarkdownMediaGallery urls={mediaGroups[galleryIndex]} mimeTypes={mediaMimeTypes} />;
          }
        }
      }

      if (Array.isArray(children) && children.length === 1) {
        const child = children[0];
        if (child && typeof child === "object" && "props" in child && child.props?.src) {
          const mimeType = mediaMimeTypes?.[child.props.src];
          if (mimeType?.startsWith("video/")) {
            return <MarkdownMediaItem url={child.props.src} mimeType={mimeType} />;
          }
        }
      } else if (
        !Array.isArray(children) &&
        children &&
        typeof children === "object" &&
        "props" in children &&
        (children as any).props?.src
      ) {
        const props = (children as any).props;
        const mimeType = mediaMimeTypes?.[props.src];
        if (mimeType?.startsWith("video/")) {
          return <MarkdownMediaItem url={props.src} mimeType={mimeType} />;
        }
      }

      return <p className="lexical-paragraph mb-4 last:mb-0">{children}</p>;
    },
    h1: ({ children }) => <h1 className="lexical-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="lexical-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="lexical-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="lexical-h4">{children}</h4>,
    h5: ({ children }) => <h5 className="lexical-h5">{children}</h5>,
    h6: ({ children }) => <h6 className="lexical-h6">{children}</h6>,
    strong: ({ children }) => <strong className="lexical-text-bold">{children}</strong>,
    em: ({ children }) => <em className="lexical-text-italic">{children}</em>,
    del: ({ children }) => <del className="lexical-text-strikethrough">{children}</del>,
    code: ({ children }) => <code className="lexical-text-code">{children}</code>,
    pre: ({ children }) => <pre className="lexical-code">{children}</pre>,
    blockquote: ({ children }) => <blockquote className="lexical-quote">{children}</blockquote>,
    ul: ({ children }) => <ul className="lexical-list-ul">{children}</ul>,
    ol: ({ children }) => <ol className="lexical-list-ol">{children}</ol>,
    li: ({ children }) => <li className="lexical-listitem">{children}</li>,
    a: createCustomLink(colorClasses, mentions),
    img: createCustomImage(mediaMimeTypes),
    u: ({ children }) => <u className="lexical-text-underline">{children}</u>,
  };

  const extractedUrls = useMemo(() => {
    return extractUrlsFromText(processedContent);
  }, [processedContent]);

  return (
    <>
      <ReactMarkdown
        className={`${className}`}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw as any]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
      {showLinkPreviews && extractedUrls.length > 0 && (
        <div className="mt-4 space-y-3">
          {extractedUrls.map((url, index) => (
            <LinkPreview key={`${url}-${index}`} url={url} />
          ))}
        </div>
      )}
    </>
  );
};

export default Markdown;
