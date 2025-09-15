declare module "react-markdown/lib/complex-types" {
  import type { ComponentPropsWithoutRef, ComponentType } from "react";

  export interface ReactMarkdownProps {}

  export type NormalComponents = {
    [TagName in keyof React.JSX.IntrinsicElements]:
      | keyof React.JSX.IntrinsicElements
      | ComponentType<ComponentPropsWithoutRef<TagName> & ReactMarkdownProps>;
  };
}
