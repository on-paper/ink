"use client";

// import { useAccountSearch } from "~/hooks/useAccountSearch";
// import { LoadingSpinner } from "./LoadingSpinner";

export function HandleSearch({ query }: { query: string }) {
  // const { data: users, loading, error } = useAccountSearch(query);

  if (!query) return null;
  // if (error && query) throw new Error(error);

  // const limitedUsers = users?.slice(0, maxResults);
  // const list = limitedUsers?.map((user) => `@${user.username}`) || [];

  // if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-center">{/* {list} */}</div>
    </>
  );
}
