export function createSelectionQuote(text: string): string {
  return `${text
    .split(/\r?\n/)
    .map((line) => (line ? `>${line}` : ""))
    .join("\n")}\n`;
}
