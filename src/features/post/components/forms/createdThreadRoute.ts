export function getCreatedThreadRoute(threadId: string): {
  to: "/thread/$threadId";
  params: { threadId: string };
} {
  return {
    to: "/thread/$threadId",
    params: { threadId },
  };
}
