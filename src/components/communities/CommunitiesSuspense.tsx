import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const CommunitySuspenseItem = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CommunitiesSuspense = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Communities</h1>
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Community list skeleton */}
      <div className="flex flex-col gap-2">
        {[...Array(8)].map((_v, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          <CommunitySuspenseItem key={`community-suspense-${idx}`} />
        ))}
      </div>
    </>
  );
};
