import type { Post } from "../../../entities/post";
import type {
  ThreadChunkElement,
  ThreadPostState,
} from "../../../entities/thread/types";
import { isThreadChunkPost } from "../../../entities/thread/types";

export function normalizeThreadPost(
  threadId: string,
  element: ThreadChunkElement,
): Post {
  if (!isThreadChunkPost(element)) {
    return {
      id: `unavailable-${threadId}-${element.seq}`,
      threadId,
      seq: element.seq,
      status: "unavailable",
      body: "",
      createdAt: "",
      attachment: null,
      sodaneCount: 0,
      displayId: null,
    };
  }

  return {
    ...element,
    threadId,
    status: "public",
    sodaneCount: 0,
  };
}

export function mergeThreadPosts(
  threadId: string,
  elements: ThreadChunkElement[],
  postStates: ThreadPostState[],
  previousPosts: Post[] = [],
): Post[] {
  const stateBySeq = new Map(postStates.map((state) => [state.seq, state]));
  const previousBySeq = new Map(previousPosts.map((post) => [post.seq, post]));
  const nextPosts = elements.map((element) => {
    const basePost = normalizeThreadPost(threadId, element);
    const state = stateBySeq.get(basePost.seq);
    const nextPost = state ? applyPostState(basePost, state) : basePost;
    const previousPost = previousBySeq.get(nextPost.seq);
    return previousPost && arePostsEqual(previousPost, nextPost)
      ? previousPost
      : nextPost;
  });

  if (
    previousPosts.length === nextPosts.length &&
    nextPosts.every((post, index) => post === previousPosts[index])
  ) {
    return previousPosts;
  }
  return nextPosts;
}

export function isPostVisible(status: Post["status"]): boolean {
  return status === "public";
}

function applyPostState(post: Post, state: ThreadPostState): Post {
  if (state.status === "public" && post.status === "unavailable") {
    return post.sodaneCount === state.reactions.up
      ? post
      : { ...post, sodaneCount: state.reactions.up };
  }
  const isUnavailable = !isPostVisible(state.status);
  const nextBody = isUnavailable ? "" : post.body;
  const nextAttachment = isUnavailable ? null : post.attachment;
  const nextStatus = state.status;
  const nextSodaneCount = state.reactions.up;

  if (
    post.status === nextStatus &&
    post.body === nextBody &&
    post.attachment === nextAttachment &&
    post.sodaneCount === nextSodaneCount
  ) {
    return post;
  }

  return {
    ...post,
    status: nextStatus,
    body: nextBody,
    attachment: nextAttachment,
    sodaneCount: nextSodaneCount,
  };
}

function arePostsEqual(left: Post, right: Post): boolean {
  return (
    left.id === right.id &&
    left.threadId === right.threadId &&
    left.seq === right.seq &&
    left.status === right.status &&
    left.body === right.body &&
    left.createdAt === right.createdAt &&
    left.attachment === right.attachment &&
    left.sodaneCount === right.sodaneCount &&
    left.delCount === right.delCount &&
    left.displayId === right.displayId
  );
}
