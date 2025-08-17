import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const CommunitySuspenseItem = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CommunitiesListSuspense = () => {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(8)].map((_v, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
        <CommunitySuspenseItem key={`community-suspense-${idx}`} />
      ))}
    </div>
  );
};
