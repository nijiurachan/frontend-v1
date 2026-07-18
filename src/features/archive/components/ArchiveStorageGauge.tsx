import type { ArchiveStorage } from "@/features/archive/types";

const BYTES_PER_GIGABYTE: number = 1024 ** 3;
const PERCENTAGE: number = 100;

interface ArchiveStorageGaugeProps {
  storage: ArchiveStorage;
}

export const ArchiveStorageGauge: React.FunctionComponent<
  ArchiveStorageGaugeProps
> = ({ storage }: ArchiveStorageGaugeProps) => {
  const usedBytes = Math.max(0, storage.usedBytes);
  const limitBytes = Math.max(0, storage.limitBytes);
  const remainingBytes = Math.max(0, storage.remainingBytes);
  const usageRatio =
    limitBytes > 0 ? Math.min(1, Math.max(0, usedBytes / limitBytes)) : 0;
  const usagePercentage = usageRatio * PERCENTAGE;

  return (
    <section
      aria-labelledby="archive-storage-heading"
      className="flex flex-col gap-2 m-2 p-4 rounded-lg bg-card"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="archive-storage-heading"
          className="text-sm font-medium text-foreground"
        >
          過去ログ容量
        </h2>
        <span className="text-xs text-muted-foreground">
          使用量 {(usedBytes / BYTES_PER_GIGABYTE).toFixed(1)}GB /{" "}
          {(limitBytes / BYTES_PER_GIGABYTE).toFixed(1)}GB（残り{" "}
          {(remainingBytes / BYTES_PER_GIGABYTE).toFixed(1)}GB）
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="過去ログ容量の使用率"
        aria-valuemin={0}
        aria-valuemax={PERCENTAGE}
        aria-valuenow={Number(usagePercentage.toFixed(1))}
        className="h-2 rounded-full bg-muted overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${usagePercentage.toFixed(1)}%` }}
        />
      </div>
    </section>
  );
};
