import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://paper.ink";

  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
  ];

  const featurePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mint-efp`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const languages = ["en", "zh", "jp"];
  const docPaths = [
    { path: "overview", priority: 0.9 },
    { path: "architecture", priority: 0.8 },
    { path: "protocols/ens", priority: 0.75 },
    { path: "protocols/efp", priority: 0.75 },
    { path: "protocols/ecp", priority: 0.75 },
    { path: "features/gasless-transactions", priority: 0.7 },
  ];

  const docsPages: MetadataRoute.Sitemap = [];

  for (const lang of languages) {
    for (const doc of docPaths) {
      // English docs don't have language prefix due to hideLocale: "default-locale"
      const url = lang === "en"
        ? `${baseUrl}/docs/${doc.path}`
        : `${baseUrl}/${lang}/docs/${doc.path}`;

      docsPages.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: doc.priority * (lang === "en" ? 1 : 0.9), // Slightly lower priority for non-English
      });
    }

    const rootUrl = lang === "en" ? `${baseUrl}/docs` : `${baseUrl}/${lang}/docs`;

    docsPages.push({
      url: rootUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85 * (lang === "en" ? 1 : 0.9),
    });
  }

  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const accountPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/bookmarks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/activity`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return [
    ...corePages,
    ...featurePages,
    ...docsPages,
    ...legalPages,
    ...accountPages,
  ];
}
