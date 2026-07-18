import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { postNo } from "@/entities/post/types";
import type { SearchResponse } from "@/entities/thread/types";
import { apiGet } from "@/shared/api/client";
import { Message } from "@/shared/ui/feedback";
import { getApiErrorMessage } from "@/shared/ui/feedback/apiErrorMessage";
import { Button, Input } from "@/shared/ui/form";

export const SearchPage: React.FunctionComponent = () => {
  const { q = "" } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState({ source: q, value: q });
  const input = draft.source === q ? draft.value : q;
  const normalizedQuery = q.trim();
  const searchQuery = useQuery({
    queryKey: ["public-post-search", normalizedQuery],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiGet<SearchResponse>(
        `/search?q=${encodeURIComponent(normalizedQuery)}`,
        {
          signal,
          cache: "no-store",
        },
      ),
    enabled: normalizedQuery.length > 0,
    staleTime: 0,
  });

  const submit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void navigate({ search: { q: input.trim() } });
  };

  return (
    <section className="public-search-page">
      <title>投稿検索 - {import.meta.env.APP_NAME}</title>
      <nav aria-label="投稿検索メニュー">
        <Link to="/">カタログ</Link>
        <Link to="/board">掲示板</Link>
      </nav>
      <h1>掲示板全体の投稿検索</h1>
      <p>公開中のライブ投稿を新しい順に最大100件表示します。</p>
      <search>
        <form onSubmit={submit} className="public-search-form">
          <Input
            value={input}
            maxLength={100}
            onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
              setDraft({ source: q, value: event.target.value })
            }
            aria-label="掲示板全体の投稿検索"
          />
          <Button
            type="submit"
            disabled={!input.trim() || searchQuery.isFetching}
          >
            {searchQuery.isFetching ? "検索中" : "検索"}
          </Button>
        </form>
      </search>
      {!normalizedQuery ? (
        <Message variant="info">検索語を入力してください</Message>
      ) : searchQuery.error ? (
        <Message variant="error">
          {getApiErrorMessage(searchQuery.error, "検索に失敗しました")}
        </Message>
      ) : searchQuery.data?.posts.length === 0 ? (
        <Message variant="info">一致する公開投稿はありません</Message>
      ) : (
        <ol className="public-search-results" aria-live="polite">
          {searchQuery.data?.posts.map((post) => (
            <li key={post.id}>
              <Link to="/thread/$threadId" params={{ threadId: post.threadId }}>
                No.{postNo(post)} / スレッドへ
              </Link>
              <p>{post.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
