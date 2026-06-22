// src/pages/JukeboxPage.tsx
import { JukeboxPlayer } from "@/features/jukebox/components/JukeboxPlayer";

export const JukeboxPage: React.FunctionComponent = () => {
  return (
    <main className="min-h-screen bg-background">
      <header className="px-4 py-3 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">
          ジュークボックス
        </h1>
      </header>
      <JukeboxPlayer />
    </main>
  );
};
