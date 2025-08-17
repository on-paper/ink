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
import { ImageViewer } from "./ImageViewer";
import { UserLazyHandle } from "./user/UserLazyHandle";
import "~/components/composer/lexical.css";

const BASE_URL = getBaseUrl();

export const extractConsecutiveImages = (content: string): { imageGroups: string[][]; processedContent: string } => {
  const lines = content.split("\n");
  const imageGroups: string[][] = [];
  let currentGroup: string[] = [];
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line is purely an image
    if (trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)) {
      const match = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (match) {
        currentGroup.push(match[2]);
      }

      // Look ahead to see if next lines are also images
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine === "") {
          // Empty line, could be separator between images
          j++;
        } else if (nextLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)) {
          // Another image
          const nextMatch = nextLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (nextMatch) {
            currentGroup.push(nextMatch[2]);
          }
          i = j; // Skip this line in the main loop
          j++;
        } else {
          // Not an image, stop collecting
          break;
        }
      }

      // Now we have collected all consecutive images
      if (currentGroup.length > 1) {
        // Multiple images, create a gallery
        imageGroups.push([...currentGroup]);
        // Use a placeholder that we'll detect and replace
        // Add empty lines to ensure it's treated as its own paragraph
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        processedLines.push(`GALLERY_PLACEHOLDER_${imageGroups.length - 1}`);
        processedLines.push('');
      } else if (currentGroup.length === 1) {
        // Single image, keep as-is
        processedLines.push(line);
      }

      currentGroup = [];
      i = j - 1; // Continue from where we stopped
    } else {
      // Regular line, not an image
      processedLines.push(line);
    }
  }

  return { imageGroups, processedContent: processedLines.join("\n") };
};

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

const MarkdownImageGallery = ({ images }: { images: string[] }) => {
  const galleryItems = images.map(url => ({ item: url, type: "image" }));

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide my-2" style={{ height: "300px" }}>
      <div className="flex gap-2 h-full items-center" style={{ width: "max-content" }}>
        {images.map((url, index) => (
          <div key={`gallery-img-${index}`} className="h-full flex items-center">
            <ImageViewer
              src={url}
              alt={`Gallery image ${index + 1}`}
              className="h-full max-h-[300px] w-auto object-contain border rounded-xl cursor-pointer"
              galleryItems={galleryItems}
              currentIndex={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const Markdown: React.FC<{
  content: string;
  mentions?: PostMention[];
  className?: string;
  showLinkPreviews?: boolean;
}> = ({ content, mentions, className = "", showLinkPreviews = false }) => {
  let processedText = content;

  processedText = parseContent(content).replaceHandles().toString();

  // Extract consecutive images and get processed content
  const { imageGroups, processedContent } = useMemo(() => {
    return extractConsecutiveImages(processedText);
  }, [processedText]);

  const colorClasses =
    className
      .split(" ")
      .filter((cls) => cls.includes("text-"))
      .join(" ") || "";

  const createCustomLink = (colorClasses: string, mentions?: PostMention[]): Components["a"] => {
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

      // Handle standalone ENS names and addresses
      if (href && (href.match(/^[\w]+\.eth$/) || href.match(/^0x[a-fA-F0-9]{40}$/))) {
        return (
          <span className={`lexical-link ${colorClasses}`}>
            <UserLazyHandle handle={href} />
          </span>
        );
      }

      // Handle legacy URLs
      if (href?.startsWith(BASE_URL)) {
        if (href.startsWith(`${BASE_URL}mention/`) && mentions) {
          const mentionIndex = Number.parseInt(href.split("/mention/")[1], 10);
          const mention = mentions[mentionIndex];
          if (mention && mention.__typename === "AccountMention") {
            let handle = mention.localName;
            if (!handle) {
              handle = mention.account;
            }

            return (
              <span className={`lexical-link ${colorClasses}`}>
                <UserLazyHandle handle={handle} className={colorClasses} />
              </span>
            );
          }
        }
        if (href.startsWith(`${BASE_URL}u/`)) {
          return (
            <span className={`lexical-link ${colorClasses}`}>
              <UserLazyHandle handle={href.split("/u/")[1]} />
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

  const components: Components = {
    p: ({ children }) => {
      // Check if this paragraph contains a gallery placeholder
      // Children could be a string, array, or React element
      let textContent = '';

      if (typeof children === 'string') {
        textContent = children;
      } else if (Array.isArray(children)) {
        // Check if any child is the gallery placeholder
        textContent = children.map(child =>
          typeof child === 'string' ? child : ''
        ).join('');
      }

      if (textContent.includes('GALLERY_PLACEHOLDER_')) {
        const match = textContent.match(/GALLERY_PLACEHOLDER_(\d+)/);
        if (match) {
          const galleryIndex = Number.parseInt(match[1], 10);
          if (imageGroups[galleryIndex]) {
            return <MarkdownImageGallery images={imageGroups[galleryIndex]} />;
          }
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
    img: CustomImage,
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

const CustomImage: Components["img"] = ({ node, ...props }) => {
  const { src, alt } = props;
  if (!src) return null;
  return (
    <div className="max-w-xl">
      <ImageViewer src={src} alt={alt} className="rounded-lg w-full" />
    </div>
  );
};

export default Markdown;
