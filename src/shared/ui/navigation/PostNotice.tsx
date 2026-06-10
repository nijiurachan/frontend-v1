import { OnlineUsersIndicator } from "./OnlineUsersIndicator";
import { TextLink } from "./TextLink";

/** 投稿欄下に置く注意書き */
export const PostNotice: React.FunctionComponent = () => {
  return (
    <p className="text-xs text-center text-muted-foreground">
      投稿により<TextLink href="/rules.html">利用規約</TextLink>
      に同意したものとみなします.
      <OnlineUsersIndicator className="ml-1" />
    </p>
  );
};
