import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useFavStore } from "@/features/fav-filter/stores/favStore";
import { SettingRow, SettingSection } from "@/features/settings/ui";
import { Button, Input } from "@/shared/ui/form";

type InputChangeEvent = React.ChangeEvent<HTMLInputElement, HTMLInputElement>;

/**
 * お気に入り設定タブのコンテンツ（カタログ並び替え専用）
 */
export const FavSettings: React.FunctionComponent = () => {
  const {
    favWords,
    favRegexes,
    favWords2,
    favRegexes2,
    addFavWord,
    removeFavWord,
    addFavRegex,
    removeFavRegex,
    addFavWord2,
    removeFavWord2,
    addFavRegex2,
    removeFavRegex2,
  } = useFavStore();

  const [favWordInput, setFavWordInput] = useState("");
  const [favRegexInput, setFavRegexInput] = useState("");
  const [favWord2Input, setFavWord2Input] = useState("");
  const [favRegex2Input, setFavRegex2Input] = useState("");

  const handleAddFavWord = (): void => {
    const word = favWordInput.trim();
    if (!word) {
      alert("お気に入りワードを入力してください");
      return;
    }
    addFavWord(word);
    setFavWordInput("");
  };

  const handleAddFavRegex = (): void => {
    const regex = favRegexInput.trim();
    if (!regex) {
      alert("正規表現パターンを入力してください");
      return;
    }
    // 正規表現の妥当性チェックはaddFavRegex内で行われる
    try {
      new RegExp(regex);
      addFavRegex(regex);
      setFavRegexInput("");
    } catch {
      alert("無効な正規表現パターンです");
    }
  };

  const handleAddFavWord2 = (): void => {
    const word = favWord2Input.trim();
    if (!word) {
      alert("超お気に入りワードを入力してください");
      return;
    }
    addFavWord2(word);
    setFavWord2Input("");
  };

  const handleAddFavRegex2 = (): void => {
    const regex = favRegex2Input.trim();
    if (!regex) {
      alert("正規表現パターンを入力してください");
      return;
    }
    // 正規表現の妥当性チェックはaddFavRegex2内で行われる
    try {
      new RegExp(regex);
      addFavRegex2(regex);
      setFavRegex2Input("");
    } catch {
      alert("無効な正規表現パターンです");
    }
  };

  return (
    <>
      <SettingSection
        title="超お気に入りワード"
        description="本文部分一致でカタログ最上位に表示"
      >
        <SettingRow>
          <Input
            type="text"
            placeholder="超お気に入りワードを入力"
            className="w-full"
            value={favWord2Input}
            onChange={(e: InputChangeEvent): void =>
              setFavWord2Input(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddFavWord2();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddFavWord2}>
            追加
          </Button>
        </SettingRow>
        {favWords2.length > 0 ? (
          <div className="space-y-2">
            {favWords2.map((word) => (
              <SettingRow key={word}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-foreground truncate">{word}</span>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeFavWord2(word)}
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

      <SettingSection
        title="超お気に入り正規表現"
        description="正規表現パターンでカタログ最上位に表示"
      >
        <SettingRow>
          <Input
            type="text"
            placeholder="正規表現パターン（例: ^fav.*）"
            className="w-full"
            value={favRegex2Input}
            onChange={(e: InputChangeEvent): void =>
              setFavRegex2Input(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddFavRegex2();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddFavRegex2}>
            追加
          </Button>
        </SettingRow>
        {favRegexes2.length > 0 ? (
          <div className="space-y-2">
            {favRegexes2.map((regex) => (
              <SettingRow key={regex}>
                <div className="flex items-center justify-between w-full gap-2">
                  <code className="text-foreground text-sm truncate">
                    {regex}
                  </code>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeFavRegex2(regex)}
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

      <SettingSection
        title="お気に入りワード"
        description="本文部分一致でカタログ上位に表示"
      >
        <SettingRow>
          <Input
            type="text"
            placeholder="お気に入りワードを入力"
            className="w-full"
            value={favWordInput}
            onChange={(e: InputChangeEvent): void =>
              setFavWordInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddFavWord();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddFavWord}>
            追加
          </Button>
        </SettingRow>
        {favWords.length > 0 ? (
          <div className="space-y-2">
            {favWords.map((word) => (
              <SettingRow key={word}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-foreground truncate">{word}</span>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeFavWord(word)}
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

      <SettingSection
        title="お気に入り正規表現"
        description="正規表現パターンでカタログ上位に表示"
      >
        <SettingRow>
          <Input
            type="text"
            placeholder="正規表現パターン（例: ^fav.*）"
            className="w-full"
            value={favRegexInput}
            onChange={(e: InputChangeEvent): void =>
              setFavRegexInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === "Enter") {
                handleAddFavRegex();
              }
            }}
          />
          <Button variant="primary" onClick={handleAddFavRegex}>
            追加
          </Button>
        </SettingRow>
        {favRegexes.length > 0 ? (
          <div className="space-y-2">
            {favRegexes.map((regex) => (
              <SettingRow key={regex}>
                <div className="flex items-center justify-between w-full gap-2">
                  <code className="text-foreground text-sm truncate">
                    {regex}
                  </code>
                  <Button
                    variant="ghost"
                    onClick={(): void => removeFavRegex(regex)}
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

      <SettingSection title="正規表現について">
        <SettingRow>
          <div className="text-sm text-muted-foreground space-y-3 w-full">
            <p>正規表現は高度な選択を行う特殊記法です。</p>
            <div className="space-y-1">
              <p>例：AとBを両方含む</p>
              <code className="block text-foreground bg-muted px-2 py-1 rounded text-xs">
                ^(?=.*A)(?=.*B).*
              </code>
            </div>
            <div className="space-y-1">
              <p>例：Aは含むが、Bは含まない</p>
              <code className="block text-foreground bg-muted px-2 py-1 rounded text-xs">
                ^(?=.*A)(?!.*B).*
              </code>
            </div>
            <div className="space-y-1">
              <p>例：Aを含まない</p>
              <code className="block text-foreground bg-muted px-2 py-1 rounded text-xs">
                ^(?!.*A).*
              </code>
            </div>
          </div>
        </SettingRow>
      </SettingSection>
    </>
  );
};
