import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useNgStore } from "@/features/ng-filter/stores";
import { SettingRow, SettingSection } from "@/features/settings/ui";
import { Button, HashBitmap, Input, Toggle } from "@/shared/ui/form";
import { TextLink } from "@/shared/ui/navigation";

type InputChangeEvent = React.ChangeEvent<HTMLInputElement, HTMLInputElement>;

/**
 * NG設定タブのコンテンツ
 */
export const NgSettings: React.FunctionComponent = () => {
  const {
    enabled,
    showNgContent,
    hiddenThreadIds,
    ngDisplayIds,
    ngTitles,
    ngWords,
    ngRegexes,
    ngImages,
    setEnabled,
    setShowNgContent,
    unhideThread,
    addNgDisplayId,
    removeNgDisplayId,
    addNgTitle,
    removeNgTitle,
    addNgWord,
    removeNgWord,
    addNgRegex,
    removeNgRegex,
    addNgImage,
    removeNgImage,
  } = useNgStore();

  const [ngDisplayIdInput, setNgDisplayIdInput] = useState("");
  const [ngTitleInput, setNgTitleInput] = useState("");
  const [ngWordInput, setNgWordInput] = useState("");
  const [ngRegexInput, setNgRegexInput] = useState("");
  const [ngImageInput, setNgImageInput] = useState("");

  const handleAddNgDisplayId = (): void => {
    const displayId = ngDisplayIdInput.trim();
    if (!displayId) {
      alert("表示IDを入力してください");
      return;
    }
    addNgDisplayId(displayId);
    setNgDisplayIdInput("");
  };

  const handleAddNgTitle = (): void => {
    const title = ngTitleInput.trim();
    if (!title) {
      alert("NGスレ文を入力してください");
      return;
    }
    addNgTitle(title);
    setNgTitleInput("");
  };

  const handleAddNgWord = (): void => {
    const word = ngWordInput.trim();
    if (!word) {
      alert("NGワードを入力してください");
      return;
    }
    addNgWord(word);
    setNgWordInput("");
  };

  const handleAddNgRegex = (): void => {
    const regex = ngRegexInput.trim();
    if (!regex) {
      alert("正規表現パターンを入力してください");
      return;
    }
    // 正規表現の妥当性チェックはaddNgRegex内で行われる
    try {
      new RegExp(regex);
      addNgRegex(regex);
      setNgRegexInput("");
    } catch {
      alert("無効な正規表現パターンです");
    }
  };

  const handleAddNgImage = (): void => {
    const hash = ngImageInput.trim();
    if (!hash) {
      alert("画像ハッシュを入力してください");
      return;
    }
    addNgImage(hash);
    setNgImageInput("");
  };

  return (
    <>
      <SettingSection title="NG表示ID" description="投稿者の表示IDで非表示">
        <SettingRow>
          <Input
            type="text"
            placeholder="表示ID（例: ABC123）"
            className="w-full"
            value={ngDisplayIdInput}
            onChange={(e: InputChangeEvent): void =>
              setNgDisplayIdInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddNgDisplayId();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddNgDisplayId}>
            追加
          </Button>
        </SettingRow>
        {ngDisplayIds.length > 0 ? (
          <div className="space-y-2">
            {ngDisplayIds.map((displayId) => (
              <SettingRow key={displayId}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-foreground text-destructive">
                    {displayId}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeNgDisplayId(displayId)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="NGスレ文" description="スレ文部分一致で非表示">
        <SettingRow>
          <Input
            type="text"
            placeholder="NGスレ文を入力"
            className="w-full"
            value={ngTitleInput}
            onChange={(e: InputChangeEvent): void =>
              setNgTitleInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddNgTitle();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddNgTitle}>
            追加
          </Button>
        </SettingRow>
        {ngTitles.length > 0 ? (
          <div className="space-y-2">
            {ngTitles.map((title) => (
              <SettingRow key={title}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-foreground truncate">{title}</span>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeNgTitle(title)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="NGワード" description="本文部分一致で非表示">
        <SettingRow>
          <Input
            type="text"
            placeholder="NGワードを入力"
            className="w-full"
            value={ngWordInput}
            onChange={(e: InputChangeEvent): void =>
              setNgWordInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddNgWord();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddNgWord}>
            追加
          </Button>
        </SettingRow>
        {ngWords.length > 0 ? (
          <div className="space-y-2">
            {ngWords.map((word) => (
              <SettingRow key={word}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-foreground truncate">{word}</span>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeNgWord(word)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="NG正規表現" description="正規表現パターンで非表示">
        <SettingRow>
          <Input
            type="text"
            placeholder="正規表現パターン（例: ^spam.*）"
            className="w-full"
            value={ngRegexInput}
            onChange={(e: InputChangeEvent): void =>
              setNgRegexInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddNgRegex();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddNgRegex}>
            追加
          </Button>
        </SettingRow>
        {ngRegexes.length > 0 ? (
          <div className="space-y-2">
            {ngRegexes.map((regex) => (
              <SettingRow key={regex}>
                <div className="flex items-center justify-between w-full gap-2">
                  <code className="text-foreground text-sm truncate">
                    {regex}
                  </code>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeNgRegex(regex)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="NG画像" description="ハッシュから類似画像を非表示">
        <SettingRow>
          <Input
            type="text"
            placeholder="画像ハッシュ（64桁二進数 またはそれのURLセーフbase64エンコード）"
            className="w-full"
            value={ngImageInput}
            onChange={(e: InputChangeEvent): void =>
              setNgImageInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddNgImage();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddNgImage}>
            追加
          </Button>
        </SettingRow>
        {ngImages.length > 0 ? (
          <div className="space-y-2">
            {ngImages.map((bits) => (
              <SettingRow key={bits}>
                <div className="flex items-center justify-between w-full gap-2">
                  <HashBitmap bits={bits} />
                  <code className="text-foreground text-sm truncate flex-1">
                    {bits}
                  </code>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeNgImage(bits)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="非表示スレ" description="非表示にしたスレの一覧">
        {hiddenThreadIds.length > 0 ? (
          <div className="space-y-2">
            {hiddenThreadIds.map((threadId) => (
              <SettingRow key={threadId}>
                <div className="flex items-center justify-between w-full gap-2">
                  <TextLink
                    to="/thread/$threadId"
                    params={{ threadId: String(threadId) }}
                    variant="primary"
                  >
                    {threadId}
                  </TextLink>
                  <Button
                    variant="ghost"
                    onClick={(): void => unhideThread(threadId)}
                    icon={<FiX size={16} />}
                  >
                    削除
                  </Button>
                </div>
              </SettingRow>
            ))}
          </div>
        ) : (
          <SettingRow>
            <span className="text-muted-foreground">なし</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="NGフィルタ">
        <SettingRow label="NGフィルタを有効にする">
          <Toggle
            checked={enabled}
            onChange={setEnabled}
            aria-label="NGフィルタ切替"
          />
        </SettingRow>
        <SettingRow
          label="NGされたコンテンツを表示"
          description="ONにすると、NGされたスレッドやレスがラベル付きで表示されます"
        >
          <Toggle
            checked={showNgContent}
            onChange={setShowNgContent}
            aria-label="NGコンテンツ表示切替"
          />
        </SettingRow>
      </SettingSection>
    </>
  );
};
