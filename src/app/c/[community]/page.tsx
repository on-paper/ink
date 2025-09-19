import type { Metadata } from "next";
import { CommunityPostComposer } from "~/components/communities/CommunityPostComposer";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
import { generateCommunityOGUrl } from "~/utils/generateOGUrl";
import { getCommunityByAddress } from "~/utils/getCommunityByAddress";
import { resolveUrl } from "~/utils/resolveUrl";

interface CommunityPageProps {
  params: {
    community: string;
  };
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const community = await getCommunityByAddress(params.community);

  if (!community) {
    return {
      title: "Community",
      description: "Community not found",
    };
  }

  const name =
    community.metadata?.name || `Community ${community.address.slice(0, 6)}...${community.address.slice(-4)}`;
  const description = community.metadata?.description || `Join ${name} on Paper`;

  const ogImageURL = generateCommunityOGUrl({
    name: community.metadata?.name,
    address: community.address,
    icon: resolveUrl(community.metadata?.icon),
  });

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: [ogImageURL],
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/c/${params.community}`,
      siteName: "Paper",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [ogImageURL],
    },
  };
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const community = await getCommunityByAddress(params.community);

  if (!community) {
    return null;
  }

  const channelId = community.address;
  const endpoint = `/api/posts?channelId=${channelId}`;

  return (
    <>
      <CommunityPostComposer community={community} communityAddress={params.community} />
      <Feed
        ItemView={PostView}
        endpoint={endpoint}
        emptyStateTitle="No posts in this community yet"
        emptyStateDescription="Start the conversation with the first post."
      />
    </>
  );
}
