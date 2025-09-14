import { createMDX } from 'fumadocs-mdx/next';

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

const withMDX = createMDX();

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["ethereum-identity-kit", "lucide-react"],
  typescript: {
    ignoreBuildErrors: false,
  },

  redirects: async () => {
    return [
      {
        source: '/docs',
        destination: '/docs/overview',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908#issuecomment-1487801131
  webpack: (config) => {
    config.externals.push("lokijs", "encoding");

    return config;
  },
};

export default withMDX(config);
