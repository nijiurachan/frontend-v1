// src/features/jukebox/ui/AddSongForm.tsx
import { parseJukeboxUrl } from "@nijiurachan/js/pure/jukebox";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface AddSongFormProps {
  onSubmit: (url: string, onSuccess: () => void) => void;
  isPending: boolean;
  error: Error | null;
  /** state.enqueueCooldownRemainingSec — 0 = 追加可能。>0 = ボタン disable + カウントダウン表示 */
  enqueueCooldownRemainingSec: number;
}

/** enqueueCooldownRemainingSec を "N分S秒" 形式に変換する */
function formatCooldown(sec: number): string {
  const minutes = Math.floor(sec / 60);
  const secs = sec % 60;
  return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
}

function httpErrorMessage(err: Error): string {
  const e = err as Error & { status?: number; code?: string | null };
  // body の error コード優先（status だけでは 400 を区別できないため）
  if (e.code === "duration_too_long") return "10分未満の動画のみ追加できます";
  const status = e.status;
  if (status === 403) return "追加は書き込んだユーザーのみ可能です";
  if (status === 409) return "既に1曲追加済みです（再生後にまた追加できます）";
  if (status === 415) return "対応していない URL です";
  if (status === 429)
    return "続けて追加できません。時間をおいて試してください（キューが混むほど追加間隔が長くなります）";
  if (status === 400) return "URL が正しくありません";
  return `エラー: ${err.message}`;
}

export const AddSongForm: React.FunctionComponent<AddSongFormProps> = ({
  onSubmit,
  isPending,
  error,
  enqueueCooldownRemainingSec,
}: AddSongFormProps) => {
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const onCooldown = enqueueCooldownRemainingSec > 0;
  const parsed = url.trim() ? parseJukeboxUrl(url.trim()) : null;
  const isValid = parsed !== null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || onCooldown) return;
    if (!parseJukeboxUrl(trimmed)) {
      setLocalError("YouTube の URL を入力してください");
      return;
    }
    setLocalError(null);
    onSubmit(trimmed, () => {
      setUrl("");
    });
  };

  const errorMessage = localError ?? (error ? httpErrorMessage(error) : null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            setUrl(e.target.value);
            setLocalError(null);
          }}
          placeholder="(YouTube URL 10分未満)"
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-sm",
            "bg-background text-foreground placeholder:text-muted-foreground",
            "border-border focus:outline-none focus:ring-1 focus:ring-primary",
          )}
          disabled={isPending || onCooldown}
          aria-label="追加する曲の URL"
        />
        <button
          type="submit"
          disabled={isPending || onCooldown || !url.trim()}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
            "bg-primary text-primary-foreground",
            "disabled:opacity-40",
          )}
        >
          <FiPlus aria-hidden="true" size={16} />
          追加
        </button>
      </div>
      {onCooldown && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          あと {formatCooldown(enqueueCooldownRemainingSec)} で追加できます
        </p>
      )}
      {url.trim() && !isValid && !onCooldown && (
        <p className="text-xs text-muted-foreground">
          対応 URL: YouTube (watch?v=, youtu.be/, shorts/)
        </p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </form>
  );
};
