import type { PropsWithChildren } from "react";
import { RouteTitle } from "~/components/RouteTitle";

export default function layout({ children }: PropsWithChildren) {
  return (
    <div className="px-4 max-w-3xl mx-auto">
      <RouteTitle />
      {children}
    </div>
  );
}
