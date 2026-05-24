import type { HTMLProps } from "react";
import { TextLink } from "./TextLink";

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "online-users-indicator": HTMLProps<HTMLElement>;
    }
  }
}

/** 投稿欄下に置く注意書き */
export const PostNotice: React.FunctionComponent = () => {
  return (
    <p className="text-xs text-center text-muted-foreground">
      投稿により<TextLink href="/rules.html">利用規約</TextLink>
      に同意したものとみなします.
      <online-users-indicator className="ml-1" />
    </p>
  );
};
