import { Link } from "@tanstack/react-router";
import type { Post } from "@/entities/post/types";
import { postNo } from "@/entities/post/types";
import type { ThreadChunkPost } from "@/entities/thread/types";
import { getImageUrl } from "@/entities/thread/utils";
import {
  useBoardThreadTails,
  useTopPage,
} from "@/features/board/hooks/useBoardThreads";
import { LoadingScreen, Message } from "@/shared/ui/feedback";

export const BoardPage: React.FunctionComponent = () => {
  const topQuery = useTopPage();
  const threads = topQuery.data?.threads ?? [];
  const tails = useBoardThreadTails(threads.map((thread) => thread.id));

  if (topQuery.isLoading) return <LoadingScreen />;
  if (topQuery.error) {
    return <Message variant="error">掲示板の読み込みに失敗しました</Message>;
  }

  return (
    <section className="board-page">
      <title>掲示板 - {import.meta.env.APP_NAME}</title>
      <nav className="board-page-nav" aria-label="掲示板メニュー">
        <Link to="/">カタログ</Link>
        <Link to="/search">投稿検索</Link>
        <Link to="/archive">過去ログ</Link>
      </nav>
      <h1>掲示板</h1>
      {tails.isFetching && <p aria-live="polite">最新レスを取得中...</p>}
      {tails.hasError && (
        <Message variant="error">
          一部スレッドの最新レスを取得できませんでした
        </Message>
      )}
      {threads.length === 0 ? (
        <Message variant="info">スレッドはありません</Message>
      ) : (
        threads.map((thread) => (
          <article key={thread.id} className="board-thread">
            <Link
              to="/thread/$threadId"
              params={{ threadId: thread.id }}
              className="board-thread-link"
            >
              スレッドを開く（{thread.replyCount}レス）
            </Link>
            <BoardPost post={thread.opPost} isOp />
            {tails.tails.get(thread.id)?.posts.map((post) => (
              <BoardPost key={post.id} post={post} />
            ))}
          </article>
        ))
      )}
    </section>
  );
};

interface BoardPostProps {
  post: Post | ThreadChunkPost;
  isOp?: boolean;
}

const BoardPost: React.FunctionComponent<BoardPostProps> = ({
  post,
  isOp = false,
}: BoardPostProps) => (
  <div className={isOp ? "board-post board-post-op" : "board-post"}>
    {post.attachment && (
      <img src={getImageUrl(post.attachment, false)} alt="" loading="lazy" />
    )}
    <div>
      <div className="board-post-meta">
        {isOp ? "OP " : ""}No.{postNo(post)}
      </div>
      <p>{post.body}</p>
    </div>
  </div>
);
