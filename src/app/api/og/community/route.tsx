import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "next/server";

export const runtime = "nodejs";

async function generateOGImage(params: { name?: string | null; address?: string | null; icon?: string | null }) {
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const quicksandSemiBold = await readFile(path.join(fontsDir, "Quicksand-SemiBold.ttf"));
  const quicksandMedium = await readFile(path.join(fontsDir, "Quicksand-Medium.ttf"));

  const { name, address, icon } = params;

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
        data: quicksandSemiBold,
        style: "normal",
        weight: 600,
      },
    ],
  } as ImageResponseOptions;

  if (!name && !address) {
    return new ImageResponse(
      <div tw="flex items-center justify-center w-full h-full bg-[#000000] p-8 text-white flex-col">
        <div tw="text-white text-4xl font-bold pb-12">Community not found</div>
        <svg width="32" height="32" viewBox="0 0 493 487" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M350.5 426.182C299 459.5 215 476 128.486 426.182C97.8615 470.932 28 464.172 28 434.339C28 404.506 44.5 269 68 170C163.082 -74.5 499 24.9999 462 269C443.627 390.161 319.238 339.11 336.373 269M336.373 269C374.653 112.375 191.131 100.278 163.082 236.905C132.458 386.071 307.275 388.055 336.373 269Z"
            stroke="#FFFFFF"
            stroke-width="56"
            stroke-linecap="round"
          />
        </svg>
      </div>,
      pageConfig,
    );
  }

  const backgroundUrl = address ? `https://api.dicebear.com/9.x/glass/svg?seed=${address.toLowerCase()}` : null;

  const displayName = name || (address ? `Community ${address.slice(0, 6)}...${address.slice(-4)}` : "Community");

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

      {/* Centered content */}
      <div tw="w-full h-full flex flex-col items-center justify-center">
        {/* Community Icon */}
        <div tw="flex items-center justify-center w-64 h-64 rounded-3xl relative overflow-hidden mb-8">
          {backgroundUrl && (
            <img
              src={backgroundUrl}
              tw="absolute inset-0 w-full h-full"
              width="256"
              height="256"
              style={{ objectFit: "cover" }}
            />
          )}
          {icon ? (
            <img
              src={icon}
              tw="w-48 h-48 rounded-2xl relative z-10"
              width="192"
              height="192"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div tw="w-48 h-48 rounded-2xl relative z-10 flex items-center justify-center bg-white/10">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          )}
        </div>

        {/* Community Name */}
        <div tw="flex flex-col items-center">
          <div tw="text-white text-6xl font-bold flex">{displayName}</div>
        </div>
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
    name: searchParams.get("name"),
    address: searchParams.get("address"),
    icon: searchParams.get("icon"),
  });
}
