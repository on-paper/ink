import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url(),
});

interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  url?: string;
}

const cache = new Map<string, { data: OGData; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = requestSchema.parse(body);

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return NextResponse.json({ url, skipPreview: true });
    }

    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Paper/1.0;)",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/html")) {
        return NextResponse.json({ url });
      }

      const html = await response.text();
      const ogData = parseOGTags(html, url);

      cache.set(url, { data: ogData, timestamp: Date.now() });

      return NextResponse.json(ogData);
    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json({ url });
      }

      return NextResponse.json({ url });
    }
  } catch (error) {
    console.error("Link preview error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    return NextResponse.json({ url: request.url });
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#039;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number.parseInt(code)));
  decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)));

  return decoded;
}

function parseOGTags(html: string, url: string): OGData {
  const ogData: OGData = { url };

  const metaTagRegex =
    /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']*?)["'][^>]*>/gi;
  const titleRegex = /<title>([^<]+)<\/title>/i;

  let match: RegExpExecArray | null;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const property = match[1].toLowerCase();
    const content = decodeHTMLEntities(match[2]);

    switch (property) {
      case "og:title":
        ogData.title = content;
        break;
      case "og:description":
      case "description":
        if (!ogData.description) {
          ogData.description = content;
        }
        break;
      case "og:image":
        if (content.startsWith("//")) {
          ogData.image = `https:${content}`;
        } else if (content.startsWith("/")) {
          ogData.image = new URL(content, url).href;
        } else if (content.startsWith("http")) {
          ogData.image = content;
        } else {
          ogData.image = new URL(content, url).href;
        }
        break;
      case "og:site_name":
        ogData.siteName = content;
        break;
      case "og:type":
        ogData.type = content;
        break;
      case "og:url":
        ogData.url = content;
        break;
    }
  }

  if (!ogData.title) {
    const titleMatch = titleRegex.exec(html);
    if (titleMatch) {
      ogData.title = decodeHTMLEntities(titleMatch[1].trim());
    }
  }

  if (!ogData.siteName) {
    try {
      ogData.siteName = new URL(url).hostname.replace("www.", "");
    } catch {}
  }

  return ogData;
}
