import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "next/server";

export const runtime = "nodejs";

function cleanContent(content: string): string {
  if (!content) return "";

  let cleanedContent = decodeURIComponent(content.length > 900 ? content.slice(0, 900) : content);

  cleanedContent = cleanedContent
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\~/g, "~")
    .replace(/\\-/g, "-")
    .replace(/\\\[/g, "[")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();

  // Remove markdown headers (# and ##) - keep the text
  cleanedContent = cleanedContent.replace(/^#{1,6}\s+/gm, "");

  // Remove asterisk at beginning of lines - keep the text
  cleanedContent = cleanedContent.replace(/^\*\s*/gm, "");

  // Remove image markdown syntax, keeping the alt text
  cleanedContent = cleanedContent.replace(/^!\[([^\]]*)\]\([^)]+\)/gm, "$1");

  // Remove underscores around text
  cleanedContent = cleanedContent.replace(/_([^_]+)_/g, "$1");
  // Clean up markdown links
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove standalone URLs
  cleanedContent = cleanedContent.replace(/https?:\/\/[^\s]+/g, (url) => {
    try {
      const urlObj = new URL(url);
      return `[${urlObj.hostname.replace("www.", "")}]`;
    } catch {
      return "[link]";
    }
  });

  cleanedContent = cleanedContent.replace(/@lens\/(\w+)/g, "$1");

  return cleanedContent;
}

async function generateOGImage(params: {
  handle?: string | null;
  content?: string | null;
  image?: string | null;
  profilePictureUrl?: string | null;
}) {
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const quicksandBold = await readFile(path.join(fontsDir, "Quicksand-Bold.ttf"));
  const quicksandMedium = await readFile(path.join(fontsDir, "Quicksand-Medium.ttf"));

  const { handle, content, image, profilePictureUrl } = params;

  const pageConfig = {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Quicksand",
        data: quicksandMedium,
        style: "normal",
        weight: 400,
      },
      {
        name: "Quicksand",
        data: quicksandBold,
        style: "normal",
        weight: 700,
      },
    ],
  } as ImageResponseOptions;

  if (!handle) {
    return new ImageResponse(
      <div tw="flex items-center justify-center w-full h-full bg-[#000000] p-8 text-white flex-col">
        <div tw="text-white text-4xl font-bold pb-12">Post not found</div>
        <svg width="32" height="32" viewBox="0 0 493 487" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#FFFFFF"
            strokeWidth={56}
            strokeLinecap="round"
          />
        </svg>
      </div>,
      pageConfig,
    );
  }

  return new ImageResponse(
    <div tw="w-full h-full flex bg-[#000000] relative overflow-hidden">
      {image && (
        <div tw="absolute inset-0 flex items-center justify-end">
          <img
            src={image}
            tw="w-full h-full"
            width="1200"
            height="630"
            style={{ filter: "brightness(0.3)", objectFit: "cover" }}
          />
        </div>
      )}

      <div tw="absolute flex items-center justify-center bottom-[-50px] left-[-50px] w-[420px] h-[420px] opacity-10">
        <svg width={420} height={420} viewBox="0 0 493 487" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#FFFFFF"
            strokeWidth={56}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div tw="absolute flex items-center justify-center bottom-14 right-14">
        <svg width={80} height={80} viewBox="-100 -100 693 687" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#000000"
            strokeWidth={180}
            strokeLinecap="round"
          />
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#ffffff"
            strokeWidth={56}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div tw="relative flex flex-col justify-start p-14 w-full h-full">
        <div tw="flex items-center mb-6">
          {profilePictureUrl && (
            <div tw="flex items-center justify-center w-24 h-24 rounded-full mr-4 overflow-hidden">
              <img src={profilePictureUrl} tw="w-24 h-24" width="96" height="96" style={{ objectFit: "cover" }} />
            </div>
          )}
          <div tw="flex items-center">
            <div tw="text-white text-6xl font-bold flex pl-2 leading-[48px]">{handle}</div>
          </div>
        </div>

        {content && (
          <div tw="flex pr-20">
            <div tw="text-white text-6xl min-w-14 px-4 h-16 pt-2 justify-start flex items-start flex flex-col justify-center font-bold">
              "
            </div>
            <div tw="text-white flex-1 pr-12 text-4xl font-medium flex flex-col" style={{ lineHeight: "1.4" }}>
              {(() => {
                const cleanedContent = cleanContent(content);
                const truncatedContent =
                  cleanedContent.length > 400 ? `${cleanedContent.slice(0, 400).trim()}...` : cleanedContent;
                return truncatedContent.split("\n").map((line, index) => (
                  <div key={index} tw="flex mb-2">
                    {line}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>,
    pageConfig,
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  return generateOGImage(body);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return generateOGImage({
    handle: searchParams.get("handle"),
    content: searchParams.get("content"),
    image: searchParams.get("image"),
    profilePictureUrl: searchParams.get("profilePictureUrl"),
  });
}
