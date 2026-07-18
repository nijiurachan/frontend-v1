import { useState } from "react";
import { SettingRow, SettingSection } from "@/features/settings/ui";
import {
  DEFAULT_SPEECH_SETTINGS,
  loadSpeechSettings,
  type SpeechSettings,
  saveSpeechSettings,
} from "@/features/thread/utils/speech";
import { Input, Toggle } from "@/shared/ui/form";

/**
 * その他設定タブのコンテンツ。
 */
export const OtherSettings: React.FunctionComponent = () => {
  const [speech, setSpeech] = useState<SpeechSettings>(() =>
    loadSpeechSettings(localStorage),
  );
  const update = (partial: Partial<SpeechSettings>): void => {
    const next = { ...speech, ...partial };
    setSpeech(next);
    saveSpeechSettings(localStorage, next);
  };
  return (
    <SettingSection title="その他">
      <SettingRow label="常に読み上げ">
        <Toggle
          checked={speech.alwaysEnabled}
          onChange={(alwaysEnabled: boolean): void => update({ alwaysEnabled })}
          aria-label="常に読み上げ"
        />
      </SettingRow>
      <SettingRow label="読み上げ時に自動スクロール">
        <Toggle
          checked={speech.autoScroll}
          onChange={(autoScroll: boolean): void => update({ autoScroll })}
          aria-label="読み上げ自動スクロール"
        />
      </SettingRow>
      <SettingRow label="棒読みちゃんポート" description="既定50080">
        <Input
          type="number"
          min={1}
          max={65535}
          value={speech.port}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            update({
              port: Math.max(
                1,
                Math.min(65535, Number(event.target.value) || 50080),
              ),
            })
          }
        />
      </SettingRow>
      <SettingRow label="読み上げ速度">
        <Input
          type="number"
          min={0.5}
          max={2}
          step={0.1}
          value={speech.rate}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            update({
              rate: Math.max(0.5, Math.min(2, Number(event.target.value) || 1)),
            })
          }
        />
      </SettingRow>
      <SettingRow label="読み上げ音量">
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={speech.volume}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            update({
              volume: Math.max(0, Math.min(1, Number(event.target.value))),
            })
          }
        />
      </SettingRow>
      <SettingRow>
        <button
          type="button"
          onClick={(): void => {
            setSpeech(DEFAULT_SPEECH_SETTINGS);
            saveSpeechSettings(localStorage, DEFAULT_SPEECH_SETTINGS);
          }}
        >
          読み上げ設定を初期化
        </button>
      </SettingRow>
      <SettingRow label="書き込み認証">
        <span className="text-sm text-muted-foreground">
          投稿フォームに表示される公式ALTCHAウィジェットで確認します
        </span>
      </SettingRow>
    </SettingSection>
  );
};
