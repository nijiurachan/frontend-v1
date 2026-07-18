import { TextLink } from "@/shared/ui/navigation/TextLink";

/** 投稿欄下に置く注意書き */
export const PostNotice: React.FunctionComponent = () => {
  return (
    <p className="text-xs text-center text-muted-foreground">
      投稿により<TextLink href="/rules.html">利用規約</TextLink>
      に同意したものとみなします.
    </p>
  );
};
