import type { PostMention } from "@cartel-sh/ui";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown/lib/ast-to-react";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { parseContent } from "~/utils/parseContent";
import { CommunityHandle } from "./communities/CommunityHandle";
import { LinkPreview } from "./embeds/LinkPreview";
import { ImageViewer } from "./ImageViewer";
import { AccountMention } from "./user/AccountMention";
import { UserLazyHandle } from "./user/UserLazyHandle";
import "~/components/composer/lexical.css";

const BASE_URL = getBaseUrl();

export const extractUrlsFromText = (text: string): string[] => {
  const uniqueUrls = new Map<string, string>();

  const urlRegex = /https?:\/\/[^\s<>"\]]+/gi;
  const allMatches = text.match(urlRegex) || [];

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownUrls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkUrl = match[2].trim();
    markdownUrls.add(linkUrl);
  }

  for (const rawUrl of allMatches) {
    const cleanUrl = rawUrl.replace(/[.,;:!?]+$/, "").trim();

    if (cleanUrl.startsWith(BASE_URL) || markdownUrls.has(cleanUrl)) {
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
}> = ({ content, mentions, className = "", showLinkPreviews = false }) => {
  let processedText = content;
  if (mentions && mentions.length > 0) {
    mentions.forEach((mention, index) => {
      if (mention.__typename === "AccountMention") {
        const mentionPattern =
          mention.replace?.from || (mention.localName ? `@lens/${mention.localName}` : `@${mention.account}`);

        processedText = processedText.replace(mentionPattern, `[${mentionPattern}](${BASE_URL}mention/${index})`);
      }
    });
  } else {
    processedText = parseContent(content).replaceHandles().toString();
  }

  const colorClasses =
    className
      .split(" ")
      .filter((cls) => cls.includes("text-"))
      .join(" ") || "";

  const createCustomLink = (colorClasses: string, mentions?: PostMention[]): Components["a"] => {
    return ({ node, ...props }) => {
      const { href, children } = props;
      if (href?.startsWith(BASE_URL)) {
        if (href.startsWith(`${BASE_URL}mention/`) && mentions) {
          const mentionIndex = Number.parseInt(href.split("/mention/")[1]);
          const mention = mentions[mentionIndex];
          if (mention && mention.__typename === "AccountMention") {
            let handle = mention.localName;
            if (!handle && mention.replace?.from) {
              const handleMatch = mention.replace.from.match(/@lens\/(\w+)/);
              handle = handleMatch ? handleMatch[1] : undefined;
            }
            if (!handle) {
              const handleText = String(children);
              const handleMatch = handleText.match(/@lens\/(\w+)/);
              handle = handleMatch ? handleMatch[1] : mention.account;
            }

            return (
              <span className={`lexical-link ${colorClasses}`}>
                <AccountMention
                  account={mention.account}
                  namespace={mention.namespace}
                  localName={handle}
                  className={colorClasses}
                />
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
        if (href.startsWith(`${BASE_URL}c/`)) {
          return (
            <span className={`lexical-link ${colorClasses}`}>
              <CommunityHandle handle={href.split("/c/")[1]} />
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
    p: ({ children }) => <p className="lexical-paragraph mb-4 last:mb-0">{children}</p>,
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
    return extractUrlsFromText(processedText);
  }, [processedText]);

  return (
    <>
      <ReactMarkdown 
        className={`${className}`} 
        remarkPlugins={[remarkGfm, remarkBreaks]} 
        rehypePlugins={[rehypeRaw as any]}
        components={components}
      >
        {processedText}
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
  return <ImageViewer src={src} alt={alt} className="rounded-lg" />;
};

export default Markdown;
