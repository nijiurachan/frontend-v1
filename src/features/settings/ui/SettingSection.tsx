/** 設定項目のセクションひとつの定義 */
export interface SettingSectionProps {
  /** 設定項目の見出し */
  title: string;
  /** 見出しの下に小さく出る補足 */
  description?: string;
  /** 設定項目本体 */
  children: React.ReactNode;
}

/** 設定項目を見出しでセクション分けするコンテナ */
export const SettingSection: React.FunctionComponent<SettingSectionProps> = ({
  title,
  description,
  children,
}: SettingSectionProps) => (
  <section className="bg-card rounded-lg overflow-hidden">
    <header className="flex items-center gap-2 px-4 py-3 border-b border-primary">
      <h2 className="text-sm font-bold text-primary flex-1">{title}</h2>
      {description && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
    </header>
    <div className="divide-y divide-border">{children}</div>
  </section>
);
