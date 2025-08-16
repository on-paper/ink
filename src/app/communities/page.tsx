import { Metadata } from "next";
import { Suspense } from "react";
import Communities from "~/components/Communities";
import { CommunitiesSuspense } from "~/components/communities/CommunitiesSuspense";

export const metadata: Metadata = {
  title: "Communities",
  description: "Discover and join communities on Paper",
};

export default function CommunitiesPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q || "";

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Suspense fallback={<CommunitiesSuspense />}>
        <Communities initialQuery={query} />
      </Suspense>
    </div>
  );
}
