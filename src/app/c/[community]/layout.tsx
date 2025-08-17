import { notFound } from "next/navigation";
import { CommunityHeader } from "~/components/communities/CommunityHeader";
import { CommunityNavigation } from "~/components/communities/CommunityNavigation";
import { getCommunityByAddress } from "~/utils/getCommunityByAddress";

interface CommunityLayoutProps {
  children: React.ReactNode;
  params: {
    community: string;
  };
}

export default async function CommunityLayout({ children, params }: CommunityLayoutProps) {
  const community = await getCommunityByAddress(params.community);

  if (!community) {
    notFound();
  }

  return (
    <div className="z-[30] max-w-3xl mx-auto p-4 py-0">
      <div className="pt-4">
        <CommunityHeader community={community} />
        <CommunityNavigation communityAddress={params.community} />
        {children}
      </div>
    </div>
  );
}