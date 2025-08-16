import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "next/server";

export const runtime = "nodejs";

export async function GET() {
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

      {/* Small logo with black outline */}
      <div tw="absolute flex items-center justify-center bottom-14 right-14">
        <svg width={80} height={80} viewBox="-100 -100 693 687" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#000000"
            stroke-width="180"
            stroke-linecap="round"
          />
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#ffffff"
            stroke-width="56"
            stroke-linecap="round"
          />
        </svg>
      </div>

      {/* Centered content with tagline */}
      <div tw="w-full h-full flex flex-col items-center justify-center">
        <div tw="flex flex-col items-center text-center">
          <div tw="text-white text-7xl font-bold mb-2 opacity-60">Permanent.</div>
          <div tw="text-white text-7xl font-bold mb-2 opacity-80">Permissionless.</div>
          <div tw="text-white text-7xl font-bold flex items-center">
            <span
              style={{
                textShadow: "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3)",
              }}
            >
              Paper.
            </span>
          </div>
        </div>
      </div>
    </div>,
    pageConfig,
  );
}
