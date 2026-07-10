import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import { attachUpfileImage } from "@/features/otegaki-upfile/lib/attachUpfileImage";
import { useSubmitPost } from "@/features/post/hooks/useSubmitPost";
import { useSettingsStore } from "@/features/settings/hooks";
import {
  useResolveTurnstileToken,
  useTurnstileOnPostFailure,
  useTurnstileOnPostSuccess,
} from "@/features/turnstile/hooks";
import { type ThreadLimits, useThreadLimits } from "@/shared/hooks";
import { getFingerprint } from "@/shared/lib";
import { Button, Checkbox, Input, Textarea } from "@/shared/ui/form";
import { PostNotice } from "@/shared/ui/navigation";
import { toast } from "@/shared/ui/toast";

interface ThreadCreateFormData {
  act: string;
  comment: string;
  // null = ユーザー未編集 → resolvedLimits からシードした値を表示
  duration: { hours: string; minutes: string } | null;
  allowImageReplies: boolean;
}

interface Props {
  onSuccess?: () => void;
}

const SCOPE_NAME = "thread-create";
const UPFILE_ID = "upfile";
const UPFILE_FULL_KEY = `${SCOPE_NAME}:${UPFILE_ID}`;

const selectIsPaintPopupOpen = (s: UpfileStateFlags): boolean =>
  s.isAxnosOpen || s.isKlecksOpen;
// ライブラリははっちゃん描画完了をほぼ検知できず waiting-hacchan のまま動かない
// ため hasSelectedFile が立たない。waiting-hacchan の間は !hasSelectedFile に
// よる disabled をかけずに通す (実画像は input にセットされている前提)。
const selectIsHacchanOpen = (s: UpfileStateFlags): boolean => s.isHacchanOpen;
const selectHasSelectedFile = (s: UpfileStateFlags): boolean =>
  s.hasSelectedFile;

// PHP backend の最下層フォールバックと揃えた値。仕様 §3.1 の
// thread_duration_fallback_hours / thread_duration_min_minutes の既定値。
// API & キャッシュが共に取れない初回アクセス＋オフライン状況のみ使用。
const BACKEND_FALLBACK_LIMITS: ThreadLimits = {
  duration_hours: 12,
  min_minutes: 30,
};

function formatMinLabel(minMinutes: number): string {
  const m = Math.max(1, minMinutes);
  if (m < 60) return `${m}分`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hours}時間${rest}分` : `${hours}時間`;
}

function formatHint(limits: ThreadLimits): string {
  const hours = Math.max(1, limits.duration_hours);
  return `(${formatMinLabel(limits.min_minutes)}〜${hours}時間)`;
}

function buildInitialDuration(limits: ThreadLimits | null): {
  hours: string;
  minutes: string;
} {
  if (!limits) return { hours: "", minutes: "" };
  // 既定値は上限の半分（分単位で算出）。上限ぎりぎりで立てると長居しすぎる
  // 可能性があるので穏当な値として total / 2 を採用。duration_hours = 1 の
  // ケースでも 0:30 のように正しく半分を表現できるよう分単位で扱う。
  // min_minutes 未満にならないよう下限でクランプする。
  const halfMinutes = Math.floor((limits.duration_hours * 60) / 2);
  const clamped = Math.max(halfMinutes, limits.min_minutes);
  return {
    hours: String(Math.floor(clamped / 60)),
    minutes: String(clamped % 60),
  };
}

function validateDuration(
  hours: string,
  minutes: string,
  limits: ThreadLimits | null,
): string | null {
  // limits 未解決時は検証スキップ（取得中に誤警告を出さない）
  if (!limits) return null;
  if (hours === "" || minutes === "") {
    return "保持期間を入力してください";
  }
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isInteger(h) || !Number.isInteger(m)) {
    return "整数で入力してください";
  }
  if (m >= 60) {
    return "分は 0〜59 で入力してください";
  }
  if (h < 0 || m < 0) {
    return "0 以上で入力してください";
  }
  const total = h * 60 + m;
  if (total < limits.min_minutes) {
    return `${formatMinLabel(limits.min_minutes)}以上にしてください`;
  }
  if (total > limits.duration_hours * 60) {
    return `${Math.max(1, limits.duration_hours)}時間以下にしてください`;
  }
  return null;
}

export const ThreadCreateForm: React.FunctionComponent<Props> = ({
  onSuccess,
}: Props) => {
  const { deleteKey } = useSettingsStore();
  const { data: limits, isError } = useThreadLimits();

  // 3-layer resolution:
  //   [1] API response
  //   [2] localStorage cached previous API value (useThreadLimits の initialData)
  //   [3] PHP backend の最下層デフォルト（BACKEND_FALLBACK_LIMITS）
  // API が settle（error 確定）するまでは null のままにして「取得中」表示を出す。
  const resolvedLimits: ThreadLimits | null =
    limits ?? (isError ? BACKEND_FALLBACK_LIMITS : null);

  const [formData, setFormData] = useState<ThreadCreateFormData>({
    act: "",
    comment: "",
    duration: null,
    allowImageReplies: true,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const isPaintPopupOpen =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectIsPaintPopupOpen,
    ) ?? false;
  const isHacchanOpen =
    useEventLatest(UPFILE_FULL_KEY, "aimg:upfile-state", selectIsHacchanOpen) ??
    false;
  const hasSelectedFile =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectHasSelectedFile,
    ) ?? false;

  // duration === null means the user hasn't typed yet; seed from resolvedLimits.
  // Once the user edits either field, `duration` becomes an object and
  // we no longer overwrite it.
  const effectiveDuration: { hours: string; minutes: string } =
    formData.duration ?? buildInitialDuration(resolvedLimits);

  const durationError: string | null = validateDuration(
    effectiveDuration.hours,
    effectiveDuration.minutes,
    resolvedLimits,
  );

  const { mutateAsync: submitPost, isPending } = useSubmitPost();
  const resolveTurnstileToken = useResolveTurnstileToken("thread");
  const onTurnstileSuccess = useTurnstileOnPostSuccess();
  const onTurnstileFailure = useTurnstileOnPostFailure();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDurationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const base = prev.duration ?? buildInitialDuration(resolvedLimits);
      return {
        ...prev,
        duration: { ...base, [name]: value },
      };
    });
  };

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    // Enter / form.requestSubmit() で disabled を回避されてもガード。
    // 同条件を <Button disabled={...}> 側にもミラーしてある。
    if (isPaintPopupOpen) {
      return;
    }

    // 制限値未取得（API 取得中かつ error 未確定）の間は送信させない。
    // ここを抜けると effectiveDuration が "" のまま "0:00" として送られる。
    if (!resolvedLimits) {
      return;
    }

    // duration の範囲検証（バックエンド到達前）
    if (durationError) {
      toast.error(durationError);
      return;
    }

    const form = e.currentTarget;
    const prepareEvent = new CustomEvent("aimg:prepare-submit", {
      detail: {} as { preparing?: Promise<void> },
    });
    form.dispatchEvent(prepareEvent);
    await prepareEvent.detail.preparing;
    // submit 前に focus を外して IME 入力を確定させる
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const token = await resolveTurnstileToken();
    if (token === null) return;

    // ② FormData組み立て
    // <Textarea name="comment"> 経由で comment は new FormData(form) に既に入って
    // いるため、ここでは append でなく set で上書きしないと重複キーになる。
    // 他のフィールドも整合のため一律 set にする (PostForm と同じパターン)。
    const data = new FormData(form);
    data.delete("act");
    data.set("email", formData.act);
    data.set("comment", formData.comment);
    data.set("password", deleteKey);
    data.set("allow_image_replies", formData.allowImageReplies ? "1" : "0");

    const attached = attachUpfileImage(form, data);

    if (!attached) {
      toast.error("画像を選択してください");
      return;
    }

    // duration は時/分 2 つの <Input name="hours|minutes"> として表示しているので
    // FormData に "hours"/"minutes" キーが入る。サーバへは従来通り単一の
    // "duration" キーで H:MM を送るため、自前で組み立てて重複キーを除去する。
    data.delete("hours");
    data.delete("minutes");
    const hoursNum = Number(effectiveDuration.hours);
    const minutesNum = Number(effectiveDuration.minutes);
    data.set("duration", `${hoursNum}:${String(minutesNum).padStart(2, "0")}`);

    const fingerprint = await getFingerprint();
    data.set("fingerprint", fingerprint);

    // ⑤ Turnstileトークン
    data.set("cf-turnstile-response", token);

    try {
      await submitPost({ formData: data, mode: "thread" });
      form.dispatchEvent(new CustomEvent("aimg:submitted"));

      onTurnstileSuccess(token);

      // ⑧ 成功時: フォーム初期化
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          act: "",
          comment: "",
          duration: null,
          allowImageReplies: true,
        });
        onSuccess?.();
      }, 200);
    } catch {
      onTurnstileFailure();
    }
  };

  const hintText = resolvedLimits
    ? formatHint(resolvedLimits)
    : "(現在の制限を取得中...)";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-turnstile-target-form="thread"
    >
      {showSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg">
          <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full">
            <FiCheck className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-medium">成功しました！</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Input
            type="text"
            name="act"
            className="w-full"
            value={formData.act}
            onChange={handleChange}
            placeholder="例: sage ID表示"
          />
        </div>

        <div>
          <Textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
            rows={6}
          />
        </div>

        <Scope name={SCOPE_NAME}>
          <UpfileInput fullKey={UPFILE_FULL_KEY} allowImage={true} />
        </Scope>

        <div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="hours"
              value={effectiveDuration.hours}
              onChange={handleDurationChange}
              className="w-20"
              min={0}
              max={resolvedLimits?.duration_hours ?? undefined}
              step={1}
              inputMode="numeric"
              aria-invalid={durationError ? true : undefined}
              aria-describedby={durationError ? "duration-error" : undefined}
              aria-label="保持期間（時間）"
            />
            <span className="text-sm text-foreground">時間</span>
            <Input
              type="number"
              name="minutes"
              value={effectiveDuration.minutes}
              onChange={handleDurationChange}
              className="w-20"
              min={0}
              max={59}
              step={1}
              inputMode="numeric"
              aria-invalid={durationError ? true : undefined}
              aria-describedby={durationError ? "duration-error" : undefined}
              aria-label="保持期間（分）"
            />
            <span className="text-sm text-foreground">分</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{hintText}</p>
          {durationError && (
            <p id="duration-error" className="text-xs text-destructive mt-1">
              {durationError}
            </p>
          )}
        </div>

        <Checkbox
          checked={formData.allowImageReplies}
          onChange={(checked: boolean): void =>
            setFormData((prev) => ({
              ...prev,
              allowImageReplies: checked,
            }))
          }
          label="画像添付レスを許可"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={
          isPending ||
          isPaintPopupOpen ||
          (!hasSelectedFile && !isHacchanOpen) ||
          Boolean(durationError) ||
          resolvedLimits === null
        }
      >
        {isPending
          ? "書き込み中..."
          : resolvedLimits === null
            ? "制限を取得中..."
            : "スレッドを立てる"}
      </Button>

      <PostNotice />
    </form>
  );
};
