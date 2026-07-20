import { useEffect, useRef, useState } from "react";
import { FiLock, FiMinus, FiPlus, FiX } from "react-icons/fi";
import {
  type ThreadMenuOpenMethod,
  useCatalogStore,
} from "@/features/catalog/stores";
import { useHistoryStore } from "@/features/history/stores";
import { useNgStore } from "@/features/ng-filter/stores";
import { useAnnounceIcons, useSettingsStore } from "@/features/settings/hooks";
import type { AnnounceIcon } from "@/features/settings/lib/announceIconDb";
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
} from "@/features/settings/stores";
import { Select, SettingRow, SettingSection } from "@/features/settings/ui";
import { Button, Input, Toggle } from "@/shared/ui/form";
import { ConfirmDialog } from "@/shared/ui/overlay";

/**
 * 表示設定タブのコンテンツ
 */
export const DisplaySettings: React.FunctionComponent = () => {
  const {
    darkMode,
    deleteKey,
    setDeleteKey,
    privacyMode,
    setDarkMode,
    setPrivacyMode,
    oekakiTool,
    setOekakiTool,
    fontSize,
    setFontSize,
    spaceMode,
    setSpaceMode,
    jukeboxEnabled,
    setJukeboxEnabled,
    resetSettings,
    fontScalePosts,
    setFontScalePosts,
  } = useSettingsStore();
  const {
    icons: announceIcons,
    add: addAnnounceIcon,
    remove: removeAnnounceIcon,
  } = useAnnounceIcons();
  const announceFileInputRef = useRef<HTMLInputElement>(null);
  const {
    columns,
    showNew,
    showCount,
    showUnreadCount,
    catalogAnim,
    threadMenuOpenMethod,
    setColumns,
    setShowNew,
    setShowCount,
    setShowUnreadCount,
    setCatalogAnim,
    setThreadMenuOpenMethod,
    resetCatalogSettings,
  } = useCatalogStore();
  const { clearHistory } = useHistoryStore();
  const { clearAllNgSettings } = useNgStore();

  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showClearAllDataDialog, setShowClearAllDataDialog] = useState(false);

  const handleSelectAnnounceIcons = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const files = Array.from(e.target.files ?? []);
    // 同じファイルを続けて選択できるように input を毎回リセット
    e.target.value = "";
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        await addAnnounceIcon(file);
      } catch (err) {
        console.warn("アイコン追加に失敗", err);
        alert("アイコンの保存に失敗しました");
      }
    }
  };

  const handleClearHistory = (): void => {
    clearHistory();
  };

  const handleClearAllData = (): void => {
    // すべてのストアをクリア
    clearHistory();
    clearAllNgSettings();
    resetCatalogSettings();
    resetSettings();
  };

  return (
    <>
      <SettingSection title="表示設定">
        <SettingRow label="ダークモード">
          <Toggle
            checked={darkMode !== false}
            onChange={setDarkMode}
            aria-label="ダークモード切替"
          />
        </SettingRow>
        <SettingRow
          label={
            <div className="flex items-center gap-2">
              <FiLock size={16} />
              <span>プライバシーモード</span>
            </div>
          }
          description="画像を薄暗くして周囲から見えにくくします"
        >
          <Toggle
            checked={privacyMode}
            onChange={setPrivacyMode}
            aria-label="プライバシーモード切替"
          />
        </SettingRow>
        <SettingRow label="お絵かきツール">
          <Select
            value={oekakiTool}
            onChange={(value: string): void =>
              setOekakiTool(value === "klecks" ? "klecks" : "axnos")
            }
            aria-label="お絵かきツール"
          >
            <option value="axnos">AXNOS</option>
            <option value="klecks">Klecks</option>
          </Select>
        </SettingRow>
        <SettingRow
          label="アニメ画像を再生"
          description="※オンにするとGIF/WebP等のアニメ画像が表示されます。通信量を節約したい場合はオフにしてください"
        >
          <Toggle
            checked={catalogAnim === "always"}
            onChange={(v: boolean): void =>
              setCatalogAnim(v ? "always" : "never")
            }
            aria-label="アニメ画像"
          />
        </SettingRow>
        <SettingRow
          label="全体文字サイズ"
          description={<span className="text-[1rem]">{fontSize}px</span>}
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={(): void => setFontSize(fontSize - 1)}
              disabled={fontSize <= FONT_SIZE_MIN}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="全体文字サイズを小さく"
            >
              <FiMinus size={16} aria-hidden="true" />
            </button>
            <input
              type="range"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              step={1}
              value={fontSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setFontSize(Number(e.target.value))
              }
              className="flex-1"
              aria-label="全体文字サイズ"
            />
            <button
              type="button"
              onClick={(): void => setFontSize(fontSize + 1)}
              disabled={fontSize >= FONT_SIZE_MAX}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="全体文字サイズを大きく"
            >
              <FiPlus size={16} aria-hidden="true" />
            </button>
          </div>
        </SettingRow>
        <SettingRow
          label="本文文字倍率"
          description={
            <span style={{ fontSize: `${fontScalePosts}%` }}>
              {fontScalePosts}%
            </span>
          }
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={(): void => setFontScalePosts(fontScalePosts - 10)}
              disabled={fontScalePosts <= FONT_SCALE_MIN}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="本文文字倍率を小さく"
            >
              <FiMinus size={16} aria-hidden="true" />
            </button>
            <input
              type="range"
              min={FONT_SCALE_MIN}
              max={FONT_SCALE_MAX}
              step={5}
              value={fontScalePosts}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setFontScalePosts(Number(e.target.value))
              }
              className="flex-1"
              aria-label="本文文字倍率"
            />
            <button
              type="button"
              onClick={(): void => setFontScalePosts(fontScalePosts + 10)}
              disabled={fontScalePosts >= FONT_SCALE_MAX}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="本文文字倍率を大きく"
            >
              <FiPlus size={16} aria-hidden="true" />
            </button>
          </div>
        </SettingRow>
        <SettingRow label="宇宙モード">
          <Toggle
            checked={spaceMode}
            onChange={setSpaceMode}
            aria-label="宇宙モード切替"
          />
        </SettingRow>
        <SettingRow
          label="ジュークボックス"
          description="メニューにジュークボックスを表示し、みんなで共有する音楽を再生できるようにします。"
        >
          <Toggle
            checked={jukeboxEnabled}
            onChange={setJukeboxEnabled}
            aria-label="ジュークボックス切替"
          />
        </SettingRow>
      </SettingSection>
      <SettingSection
        title="運営告知バナーアイコン"
        description="複数登録するとカタログを開くたびにランダムで切替（未登録なら既定アイコン）"
      >
        <SettingRow>
          <input
            ref={announceFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
              void handleSelectAnnounceIcons(e);
            }}
            aria-label="アイコン画像を選択"
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={(): void => announceFileInputRef.current?.click()}
          >
            画像を追加
          </Button>
        </SettingRow>
        {announceIcons.length > 0 ? (
          <div className="divide-y divide-border">
            {announceIcons.map((icon) => (
              <AnnounceIconRow
                key={icon.id}
                icon={icon}
                onRemove={(): void => {
                  void removeAnnounceIcon(icon.id);
                }}
              />
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>
      <SettingSection title="カタログ設定">
        <SettingRow label="カタログ列数">
          <Select
            value={columns}
            onChange={(value: string): void => setColumns(Number(value))}
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}列
              </option>
            ))}
          </Select>
        </SettingRow>
        <SettingRow label="NEW表示">
          <Toggle
            checked={showNew}
            onChange={setShowNew}
            aria-label="NEW表示切替"
          />
        </SettingRow>
        <SettingRow label="レス数表示">
          <Toggle
            checked={showCount}
            onChange={setShowCount}
            aria-label="レス数表示切替"
          />
        </SettingRow>
        <SettingRow label="未読レス数表示">
          <Toggle
            checked={showUnreadCount}
            onChange={setShowUnreadCount}
            aria-label="未読レス数表示切替"
          />
        </SettingRow>
        <SettingRow label="メニューの開き方">
          <Select
            value={threadMenuOpenMethod}
            onChange={(value: string): void =>
              setThreadMenuOpenMethod(value as ThreadMenuOpenMethod)
            }
          >
            <option value="auto">自動</option>
            <option value="long-press">長押し</option>
            <option value="menu-button">メニューボタン</option>
            <option value="off">オフ</option>
          </Select>
        </SettingRow>
      </SettingSection>
      <SettingSection title="投稿設定">
        <SettingRow
          label="削除キー"
          description="投稿削除時に使用するパスワードです"
        >
          <Input
            type="text"
            value={deleteKey}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
            ): void => setDeleteKey(e.target.value)}
          />
        </SettingRow>
      </SettingSection>
      <SettingSection title="データ管理">
        <SettingRow>
          <Button
            variant="default"
            className="w-full py-3"
            onClick={(): void => setShowClearHistoryDialog(true)}
          >
            履歴をクリア
          </Button>
        </SettingRow>
        <SettingRow>
          <Button
            variant="destructive"
            className="w-full py-3"
            onClick={(): void => setShowClearAllDataDialog(true)}
          >
            全データをクリア
          </Button>
        </SettingRow>
      </SettingSection>

      <ConfirmDialog
        isOpen={showClearHistoryDialog}
        onClose={(): void => setShowClearHistoryDialog(false)}
        onConfirm={handleClearHistory}
        title="履歴をクリア"
        message="スレッド閲覧履歴をすべて削除します。この操作は取り消せません。"
        confirmText="削除"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={showClearAllDataDialog}
        onClose={(): void => setShowClearAllDataDialog(false)}
        onConfirm={handleClearAllData}
        title="全データをクリア"
        message={`以下のすべてのデータを削除します。この操作は取り消せません。\n\n・スレッド閲覧履歴\n・NG設定（非表示スレッド、NGワード等）\n・カタログ設定（ソート、列数、表示設定等）\n・その他の設定（テーマ、プライバシーモード等）`}
        confirmText="削除"
        variant="destructive"
      />
    </>
  );
};

/** アップロード済みアイコン1件の行。サムネイル用object URLをmount中だけ保持 */
const AnnounceIconRow: React.FunctionComponent<{
  icon: AnnounceIcon;
  onRemove: () => void;
}> = ({ icon, onRemove }: { icon: AnnounceIcon; onRemove: () => void }) => {
  // 行はicon.idでkey管理されるためblobは寿命内で不変
  const [url] = useState(() => URL.createObjectURL(icon.blob));
  useEffect(() => {
    return (): void => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <SettingRow>
      <div className="flex items-center justify-between w-full gap-3">
        <img
          src={url}
          alt=""
          className="w-8 h-8 object-contain rounded bg-muted"
        />
        <span className="text-muted-foreground text-xs flex-1 truncate">
          {formatBytes(icon.blob.size)}
        </span>
        <Button variant="ghost" onClick={onRemove} icon={<FiX size={16} />}>
          削除
        </Button>
      </div>
    </SettingRow>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
