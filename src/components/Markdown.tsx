"use client";

import type { MediaData, PostMention, TokenData } from "@cartel-sh/ui";
import React, { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { parseCAIP19URI } from "~/utils/caip19";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { getScanUrl } from "~/utils/getScanUrl";
import { parseContent } from "~/utils/parseContent";
import { LinkPreview } from "./embeds/LinkPreview";
import { extractConsecutiveMedia, MarkdownMediaGallery, MarkdownMediaItem } from "./MarkdownMedia";
import { NFTLink } from "./NFTLink";
import { TokenLink } from "./TokenLink";
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
  mediaData?: MediaData;
  tokenData?: TokenData;
}> = ({ content, mentions, className = "", showLinkPreviews = false, mediaData, tokenData }) => {
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

  // Process text to detect and render CAIP-19 URIs
  const processTextForCAIP19 = (text: string): (string | React.ReactElement)[] => {
    const caipRegex = /\b(eip155:\d+\/(?:erc[a-z0-9]{2,5}:0x[a-fA-F0-9]{40}|slip44:\d+)(?:\/\d{1,78})?)\b/gi;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = caipRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const caipUri = match[1];
      const components = parseCAIP19URI(caipUri);

      if (components?.assetNamespace && components.assetReference && components.chainId) {
        const { assetNamespace, assetReference, chainId, tokenId } = components;
        const chainIdNum = typeof chainId === "string" ? Number.parseInt(chainId, 10) : chainId;

        let scanUrl: string | null;
        if (assetNamespace === "slip44") {
          scanUrl = null;
        } else if (tokenId && (assetNamespace === "erc721" || assetNamespace === "erc1155")) {
          scanUrl = `${getScanUrl(chainIdNum, "token", assetReference)}?a=${tokenId}`;
        } else {
          scanUrl = getScanUrl(chainIdNum, "token", assetReference);
        }

        if (assetNamespace === "erc20" || assetNamespace === "slip44") {
          const metadata = tokenData?.[caipUri];
          parts.push(
            <TokenLink
              key={`caip19-${match.index}`}
              tokenAddress={assetReference}
              scanUrl={scanUrl}
              colorClasses={colorClasses}
              tokenData={metadata}
            />,
          );
        } else if (assetNamespace === "erc721" || assetNamespace === "erc1155") {
          // For NFTs, use NFTLink component
          parts.push(
            <NFTLink
              key={`caip19-${match.index}`}
              chainId={chainIdNum}
              contractAddress={assetReference}
              tokenId={tokenId}
              assetNamespace={assetNamespace}
              colorClasses={colorClasses}
            />,
          );
        } else {
          if (scanUrl) {
            parts.push(
              <a
                key={`caip19-${match.index}`}
                href={scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`lexical-link ${colorClasses}`}
              >
                {caipUri}
              </a>,
            );
          } else {
            parts.push(caipUri);
          }
        }
      } else {
        // If parsing failed, just add the text as is
        parts.push(caipUri);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const createCustomLink = (colorClasses: string, _mentions?: PostMention[]): Components["a"] => {
    return (props: any) => {
      const { href, children } = props;

      if (href?.startsWith(`${BASE_URL}/u/`)) {
        const urlHandle = href.split("/u/")[1];
        if (urlHandle) {
          let linkText = urlHandle;
          if (typeof children === "string") {
            linkText = children;
          } else if (Array.isArray(children) && children.length > 0 && typeof children[0] === "string") {
            linkText = children[0];
          }

          const handle = linkText;

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

  const createCustomImage = (mediaData?: MediaData): Components["img"] => {
    return (props: any) => {
      const { src } = props;
      if (!src) return null;
      const mimeType = mediaData?.[src];
      return <MarkdownMediaItem url={src} mimeType={mimeType} />;
    };
  };

  // Process children to detect CAIP-19 URIs in text
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      return processTextForCAIP19(children);
    }
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === "string") {
          return <React.Fragment key={index}>{processTextForCAIP19(child)}</React.Fragment>;
        }
        return child;
      });
    }
    return children;
  };

  const components: Components = {
    p: ({ children }: any) => {
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
            return <MarkdownMediaGallery urls={mediaGroups[galleryIndex]} mimeTypes={mediaData} />;
          }
        }
      }

      if (Array.isArray(children) && children.length === 1) {
        const child = children[0];
        if (child && typeof child === "object" && "props" in child && child.props?.src) {
          const mimeType = mediaData?.[child.props.src];
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
        const mimeType = mediaData?.[props.src];
        if (mimeType?.startsWith("video/")) {
          return <MarkdownMediaItem url={props.src} mimeType={mimeType} />;
        }
      }

      return <p className="lexical-paragraph mb-4 last:mb-0">{processChildren(children)}</p>;
    },
    h1: ({ children }: any) => <h1 className="lexical-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="lexical-h2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="lexical-h3">{children}</h3>,
    h4: ({ children }: any) => <h4 className="lexical-h4">{children}</h4>,
    h5: ({ children }: any) => <h5 className="lexical-h5">{children}</h5>,
    h6: ({ children }: any) => <h6 className="lexical-h6">{children}</h6>,
    strong: ({ children }: any) => <strong className="lexical-text-bold">{children}</strong>,
    em: ({ children }: any) => <em className="lexical-text-italic">{children}</em>,
    del: ({ children }: any) => <del className="lexical-text-strikethrough">{children}</del>,
    code: ({ children }: any) => <code className="lexical-text-code">{children}</code>,
    pre: ({ children }: any) => <pre className="lexical-code">{children}</pre>,
    blockquote: ({ children }: any) => <blockquote className="lexical-quote">{children}</blockquote>,
    ul: ({ children }: any) => <ul className="lexical-list-ul">{children}</ul>,
    ol: ({ children }: any) => <ol className="lexical-list-ol">{children}</ol>,
    li: ({ children }: any) => <li className="lexical-listitem">{children}</li>,
    a: createCustomLink(colorClasses, mentions),
    img: createCustomImage(mediaData),
    u: ({ children }: any) => <u className="lexical-text-underline">{children}</u>,
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
