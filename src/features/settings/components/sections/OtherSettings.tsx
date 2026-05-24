import { SettingRow, SettingSection } from "@/features/settings/ui";
import { useTurnstileModeStore } from "@/features/turnstile/stores/turnstileModeStore";
import { Toggle } from "@/shared/ui/form";

/**
 * その他設定タブのコンテンツ。
 */
export const OtherSettings: React.FunctionComponent = () => {
  const mode = useTurnstileModeStore((s) => s.mode);
  const setMode = useTurnstileModeStore((s) => s.setMode);

  return (
    <SettingSection title="クラウドフレア認証設定">
      <SettingRow
        label="認証が重い端末向けモード"
        description="※ONにすると、一度認証成功したあと、しばらく認証が免除されます。そのかわり投稿時に時々リトライが求められます。OFFにすると、裏でこまめに認証を回して投稿に備えます。"
      >
        <Toggle
          checked={mode === "light"}
          onChange={(v: boolean): void => setMode(v ? "light" : "stable")}
          aria-label="クラウドフレア認証モード"
        />
      </SettingRow>
    </SettingSection>
  );
};
