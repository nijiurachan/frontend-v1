import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import {
  DisplaySettings,
  FavSettings,
  NgSettings,
  OtherSettings,
} from "@/features/settings/components/sections";
import { cn } from "@/shared/lib";

type TabId = "display" | "ng" | "fav" | "other";

export const SettingsPage: React.FunctionComponent = () => {
  const [activeTab, setActiveTab] = useState<TabId>("display");

  const tabs: { id: TabId; label: string }[] = [
    { id: "display", label: "表示" },
    { id: "ng", label: "NG設定" },
    { id: "fav", label: "お気に入り" },
    { id: "other", label: "その他" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <title>{`設定 - ${import.meta.env.APP_NAME}`}</title>
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <FiChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">設定</h1>
          <div className="w-10" />
        </div>

        {/* タブ */}
        <div className="flex border-t border-border">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={(): void => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* コンテンツ */}
      <div className="p-4 space-y-6">
        {activeTab === "display" && <DisplaySettings />}
        {activeTab === "ng" && <NgSettings />}
        {activeTab === "fav" && <FavSettings />}
        {activeTab === "other" && <OtherSettings />}
      </div>
    </div>
  );
};
