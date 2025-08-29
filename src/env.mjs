import { z } from "zod";

const server = z.object({});

const client = z.object({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_APP_ADDRESS_TESTNET: z.string().optional(),
  NEXT_PUBLIC_APP_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_FEED_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  NEXT_PUBLIC_APP_ADDRESS_TESTNET: process.env.NEXT_PUBLIC_APP_ADDRESS_TESTNET,
  NEXT_PUBLIC_APP_ADDRESS: process.env.NEXT_PUBLIC_APP_ADDRESS,
  NEXT_PUBLIC_FEED_ADDRESS: process.env.NEXT_PUBLIC_FEED_ADDRESS,
  NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
};

const merged = server.merge(client);

let env = process.env;

if (!!process.env.SKIP_ENV_VALIDATION === false) {
  const isServer = typeof window === "undefined";

  const parsed = isServer
    ? merged.safeParse(processEnv)
    : client.safeParse(processEnv);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  // Check that NEXT_PUBLIC_SITE_URL matches the current page domain (browser only)
  if (!isServer && parsed.data.NEXT_PUBLIC_SITE_URL) {
    try {
      const expectedUrl = new URL(parsed.data.NEXT_PUBLIC_SITE_URL);
      const currentUrl = new URL(window.location.href);

      // Compare domains (hostname + port if present)
      const expectedDomain = expectedUrl.port
        ? `${expectedUrl.hostname}:${expectedUrl.port}`
        : expectedUrl.hostname;
      const currentDomain = currentUrl.port
        ? `${currentUrl.hostname}:${currentUrl.port}`
        : currentUrl.hostname;

      if (expectedDomain !== currentDomain) {
        console.error(
          `❌ NEXT_PUBLIC_SITE_URL domain mismatch: expected ${expectedDomain}, got ${currentDomain}`
        );
        throw new Error(
          `NEXT_PUBLIC_SITE_URL domain mismatch: expected ${expectedDomain}, got ${currentDomain}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("domain mismatch")) {
        throw error;
      }
      console.error("❌ Failed to validate NEXT_PUBLIC_SITE_URL:", error);
      throw new Error("Failed to validate NEXT_PUBLIC_SITE_URL");
    }
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        );
      return target[prop];
    },
  });
}

export { env };
