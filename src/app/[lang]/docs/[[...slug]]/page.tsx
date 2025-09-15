import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { MDXComponents } from "mdx/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "~/utils/docs/source";
import { generateDocsOGUrl } from "~/utils/generateOGUrl";

export default async function Page({ params }: { params: Promise<{ slug?: string[]; lang: string }> }) {
  const { slug = [], lang } = await params;
  const page = source.getPage(slug, lang);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const RelativeA = createRelativeLink(source, page);

  return (
    <DocsPage
      full
      tableOfContent={{
        style: "clerk",
        enabled: true,
      }}
      toc={page.data.toc}
      footer={{ enabled: true }}
      editOnGithub={{ owner: "on-paper", repo: "ink", sha: "main", path: `/docs/${page.locale}/${page.path}` }}
      lastUpdate={page.data.lastModified}
    >
      <DocsTitle className="font-extrabold">{page.data.title}</DocsTitle>
      {page.data.description && <DocsDescription>{page.data.description}</DocsDescription>}
      <DocsBody>
        <MDX components={getMDXComponents({ a: RelativeA })} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams("slug", "lang");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[]; lang: string }>;
}): Promise<Metadata> {
  const { slug = [], lang } = await params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const title = page.data.title;
  const description = page.data.description;
  const docPath = slug.join("/");

  const ogImageURL = generateDocsOGUrl({
    title,
    description,
    path: docPath,
    lang,
  });

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description: description || `${title} - Paper Documentation`,
      images: [ogImageURL],
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/docs/${docPath}`,
      siteName: "Paper",
      locale: lang === "en" ? "en_US" : lang === "zh" ? "zh_CN" : "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || `${title} - Paper Documentation`,
      images: [ogImageURL],
    },
  };
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    h1: (props) => <h1 {...props} className="font-bold" />,
    h2: (props) => <h2 {...props} className="font-bold" />,
    h3: (props) => <h3 {...props} className="font-bold" />,
    h4: (props) => <h4 {...props} className="font-bold" />,
    h5: (props) => <h5 {...props} className="font-bold" />,
    h6: (props) => <h6 {...props} className="font-bold" />,
    strong: (props) => <strong {...props} className="font-bold" />,
    ...components,
  };
}
