import { CommunitiesSuspense } from "~/components/communities/CommunitiesSuspense";

export default function Loading() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <CommunitiesSuspense />
    </div>
  );
}
