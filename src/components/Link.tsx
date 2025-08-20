import NextLink from "next/link";

export default function Link(props: any) {
  return <NextLink {...props} prefetch={props.prefetch ?? true} />;
}
