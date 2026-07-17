import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/shared/api";

interface OnlineUsersResponse {
  count: number;
}

interface OnlineUsersIndicatorProps {
  className?: string;
}

export const OnlineUsersIndicator: React.FunctionComponent<
  OnlineUsersIndicatorProps
> = ({ className }: OnlineUsersIndicatorProps) => {
  const { data } = useQuery({
    queryKey: ["online-users"],
    queryFn: () => apiGet<OnlineUsersResponse>("/online-users"),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  if (!data || !Number.isFinite(data.count) || data.count < 0) return null;

  return (
    <span className={className} aria-live="polite">
      現在{Math.floor(data.count)}人くらいが見てます。
    </span>
  );
};
