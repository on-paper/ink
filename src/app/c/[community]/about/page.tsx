import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Markdown from "~/components/Markdown";
import { Card, CardContent } from "~/components/ui/card";
import { generateCommunityOGUrl } from "~/utils/generateOGUrl";
import { getCommunityByAddress } from "~/utils/getCommunityByAddress";
import { getScanUrl } from "~/utils/getScanUrl";
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

  const createdDate = community.timestamp ? new Date(community.timestamp).toLocaleDateString() : null;

  // Community NFT contract address on Base
  const nftContractAddress = "0xa1043edbe1b0ffe6c12a2b8ed5afd7acb2dea396";
  // Token ID is the community address (as decimal)
  const tokenId = community.address;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          {community.metadata?.description ? (
            <Markdown content={community.metadata.description} className="text-muted-foreground" />
          ) : (
            <p className="text-muted-foreground italic">No description available</p>
          )}
        </CardContent>
      </Card>

      {community.rules && community.rules.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Community Rules</h2>
            <div className="space-y-4">
              {community.rules.map((rule, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-1">
                    {index + 1}. {rule.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{rule.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Information</h2>
          <dl className="space-y-3">
            {createdDate && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="text-sm mt-1">{new Date(createdDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</dd>
              </div>
            )}
            {community.owner && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Owner</dt>
                <dd className="text-sm mt-1">
                  <a
                    href={getScanUrl(8453, "address", community.owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{community.owner}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Community</dt>
              <dd className="text-sm mt-1">
                <a
                  href={`https://basescan.org/nft/${nftContractAddress}/${tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground">{tokenId}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
