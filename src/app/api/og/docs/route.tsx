import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Documentation";
  const description = searchParams.get("description") || "";
  const docPath = searchParams.get("path") || "";
  const lang = searchParams.get("lang") || "en";

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const quicksandBold = await readFile(path.join(fontsDir, "Quicksand-Bold.ttf"));
  const quicksandMedium = await readFile(path.join(fontsDir, "Quicksand-Medium.ttf"));

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

  // Create breadcrumb from path
  const breadcrumbs = docPath
    ? docPath
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
    : ["Documentation"];

  // Language label
  const languageLabel = lang !== "en" ? lang.toUpperCase() : "";

  return new ImageResponse(
    <div tw="w-full h-full flex bg-[#000000] relative overflow-hidden">
      {/* Background logo - large and faded */}
      <div tw="absolute flex items-center justify-center bottom-[-50px] left-[-50px] w-[420px] h-[420px] opacity-10">
        <svg width={420} height={420} viewBox="0 0 493 487" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#FFFFFF"
            stroke-width="56"
            stroke-linecap="round"
          />
        </svg>
      </div>

      {/* Language indicator */}
      {languageLabel && (
        <div tw="absolute top-14 right-14 bg-white text-black px-4 py-2 rounded text-sm font-bold">{languageLabel}</div>
      )}

      {/* Content */}
      <div tw="w-full h-full flex flex-col pt-20 px-20">
        <div tw="flex flex-col max-w-5xl">
          {/* Logo and Documentation text */}
          <div tw="flex items-center mb-6">
            <svg width={80} height={80} viewBox="-100 -100 693 687" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
                stroke="#ffffff"
                stroke-width="56"
                stroke-linecap="round"
              />
            </svg>
            <div tw="text-white text-6xl font-bold ml-4">Documentation</div>
          </div>

          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && breadcrumbs[0] !== "Documentation" && (
            <div tw="flex items-center text-white text-3xl mb-4 opacity-80">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} tw="flex items-center">
                  {index > 0 && <span tw="mx-4 text-4xl opacity-60">›</span>}
                  <span>{crumb}</span>
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div tw="text-white text-4xl font-bold mb-4 leading-tight">{title}</div>

          {/* Description */}
          {description && (
            <div tw="text-white text-2xl opacity-80 max-w-4xl leading-relaxed">
              {description.length > 200 ? `${description.slice(0, 200)}...` : description}
            </div>
          )}
        </div>
      </div>
    </div>,
    pageConfig,
  );
}
