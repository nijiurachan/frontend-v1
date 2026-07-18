export type CatalogThreadClickAction = "toggle-ng" | "reveal-r18" | "view";

export function getCatalogThreadClickAction(options: {
  isNg: boolean;
  ngRevealed: boolean;
  isR18Hidden: boolean;
}): CatalogThreadClickAction {
  if (options.isNg && !options.ngRevealed) return "toggle-ng";
  if (options.isR18Hidden) return "reveal-r18";
  return "view";
}
