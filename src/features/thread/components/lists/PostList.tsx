import { useEffect, useMemo, useRef } from "react";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import { PostItem } from "./PostItem";

/**
 * onPostFullyVisibleが指定されている場合、映り込みを検出するためのIntersectionObserverを
 * セットアップする。
 *
 * レスの真下が画面に映り込んだとき、「レスが既読になった」とみなす。
 */
function usePostReadObserver(
  onPostFullyVisible: ((replyNumberInThread: number) => void) | undefined,
  visiblePosts: Post[],
): (replyNumberInThread: number) => (element: HTMLSpanElement | null) => void {
  // キー: レスの真下に配置する1px要素(sentinel要素), 値: Post.number_in_thread(≒レス番)
  const postSentinelsRef = useRef(new Map<Element, number>());
  const observerRef = useRef<IntersectionObserver>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies(visiblePosts): 依存に必要。可視レスが変化した場合にIntersectionObserverを立て直す必要があるため
  useEffect(() => {
    if (onPostFullyVisible) {
      // 現在画面内に映り込んでいるレス番号
      const visibleReplyNumbers = new Set<number>();

      const observer = new IntersectionObserver((entries) => {
        // 画面に入ったレス番をSetに追加して、画面から出たレス番を除去する
        for (const entry of entries) {
          const replyNumber = postSentinelsRef.current.get(entry.target);
          if (replyNumber == null) {
            continue;
          }

          if (entry.isIntersecting) {
            visibleReplyNumbers.add(replyNumber);
          } else {
            visibleReplyNumbers.delete(replyNumber);
          }
        }

        // 現在画面内に映り込んでいるレス下端のうち、一番下にあるレスの番号をコールバックに渡す。
        // 一つも映り込んでいない場合(0レスの場合または巨大なレスを読んでいる場合)はコールバックを
        // 呼び出さない
        const currentReplyNumber = Math.max(...visibleReplyNumbers);
        if (Number.isFinite(currentReplyNumber)) {
          onPostFullyVisible(currentReplyNumber);
        }
      });

      observerRef.current = observer;

      for (const el of postSentinelsRef.current.keys()) {
        observer.observe(el);
      }

      return (): void => {
        observerRef.current = null;
        observer.disconnect();
      };
    }
  }, [onPostFullyVisible, visiblePosts]);

  // Sentinel要素のref属性にセットすべき関数(を生成する関数)を返す。
  //
  // 注: 内側のコールバック(element => void)は都度新しく作り直されるので、リレンダリングのたびに
  // Reactからdetach/attach処理が走る(古いコールバックにnullを渡し、新しいコールバックにelementを
  // 渡して呼び出す)。
  // パフォーマンスに支障が生じるまでは放置するが、問題となる場合は自前でMap<number, element>を管理
  // する必要がある。
  return (replyNumberInThread: number) => (element: HTMLSpanElement | null) => {
    const oldElement = [...postSentinelsRef.current].find(
      (entry) => entry[1] === replyNumberInThread,
    )?.[0];

    if (oldElement) {
      observerRef.current?.unobserve(oldElement);
      postSentinelsRef.current.delete(oldElement);
    }

    if (element) {
      postSentinelsRef.current.set(element, replyNumberInThread);
      // メモ: 初期化時はuseEffectの方が後に走るためobserverRef.currentはnullであり、効果はない。
      // ここでobserveしているのは何らかの理由で対象の要素が後から追加されたケースに備えるため。
      // (同じ要素を2度observeしても無視されるので万が一useEffectが先に走っても支障はない)
      observerRef.current?.observe(element);
    }
  };
}

interface Props {
  posts: Post[];
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
  onPostFullyVisible?: (replyNumberInThread: number) => void;
}

export const PostList: React.FunctionComponent<Props> = ({
  posts,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
  onPostFullyVisible,
}: Props) => {
  const {
    isPostHidden,
    showNgContent,
    // enabled,
    // ngDisplayIds,
    // ngWords,
    // ngRegexes,
  } = useNgStore();

  const visiblePosts = useMemo(() => {
    // showNgContentがtrueの場合はフィルタリングしない
    if (showNgContent) return posts;
    return posts.filter((post) => !isPostHidden(post));
  }, [posts, isPostHidden, showNgContent]);

  const observePostRead = usePostReadObserver(onPostFullyVisible, visiblePosts);

  // showNgContentがfalseで、すべてのレスがフィルタリングされた場合
  if (!showNgContent && visiblePosts.length === 0 && posts.length > 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        NGフィルターにより、すべてのレスが非表示になっています
      </div>
    );
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        まだレスがありません
      </div>
    );
  }

  return (
    <>
      {visiblePosts.map((post) => (
        <div key={post.id} className="relative">
          <PostItem
            post={post}
            onQuoteClick={onQuoteClick}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={allPosts}
            onJumpToPost={
              onJumpToPost ? (): void => onJumpToPost(post.seq) : undefined
            }
            isSubView={false}
          />
          <span
            ref={observePostRead(post.seq)}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-px w-px"
          />
        </div>
      ))}
    </>
  );
};
