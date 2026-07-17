import { SettingRow, SettingSection } from "@/features/settings/ui";

/**
 * その他設定タブのコンテンツ。
 */
export const OtherSettings: React.FunctionComponent = () => {
  return (
    <SettingSection title="その他">
      <SettingRow label="書き込み認証">
        <span className="text-sm text-muted-foreground">
          backend-v1のAltcha認証を使用します
        </span>
      </SettingRow>
    </SettingSection>
  );
};
