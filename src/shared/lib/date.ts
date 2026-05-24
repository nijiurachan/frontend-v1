const { format }: Intl.DateTimeFormat = new Intl.DateTimeFormat("ja", {
  weekday: "short",
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date).replace(" ", "");
  } catch {
    return "";
  }
}
