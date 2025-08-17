import type { Metadata } from "next";
import { Card, CardContent } from "~/components/ui/card";
import { generateCommunityOGUrl } from "~/utils/generateOGUrl";
import { getCommunityByAddress } from "~/utils/getCommunityByAddress";
import { resolveUrl } from "~/utils/resolveUrl";

interface CommunityAboutPageProps {
  params: {
    community: string;
  };
}

export async function generateMetadata({ params }: CommunityAboutPageProps): Promise<Metadata> {
  const community = await getCommunityByAddress(params.community);

  if (!community) {
    return {
      title: "About Community",
      description: "Community not found",
    };
  }

  const name =
    community.metadata?.name || `Community ${community.address.slice(0, 6)}...${community.address.slice(-4)}`;
  const description = `About ${name} on Paper`;

  const ogImageURL = generateCommunityOGUrl({
    name: community.metadata?.name,
    address: community.address,
    icon: resolveUrl(community.metadata?.icon),
  });

  return {
    title: `About ${name}`,
    description,
    openGraph: {
      title: `About ${name}`,
      description,
      images: [ogImageURL],
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/c/${params.community}/about`,
      siteName: "Paper",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `About ${name}`,
      description,
      images: [ogImageURL],
    },
  };
}

export default async function CommunityAboutPage({ params }: CommunityAboutPageProps) {
  const community = await getCommunityByAddress(params.community);

  if (!community) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        {community.metadata?.description ? (
          <p className="text-muted-foreground">{community.metadata.description}</p>
        ) : (
          <p className="text-muted-foreground italic">No description available</p>
        )}
      </CardContent>
    </Card>
  );
}
