export function isSearchPending(
  query: string,
  lastSearchedQuery: string,
  isSearching: boolean,
): boolean {
  return isSearching || lastSearchedQuery !== query;
}
