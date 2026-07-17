import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import mascot from "@/assets/img/icon_aimoge.webp";
import { SearchBar } from "@/features/catalog/components";

interface HeaderLink {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_LINKS: HeaderLink[] = [
  { label: "FANBOX", href: "https://aimoge.fanbox.cc/", external: true },
  {
    label: "🗳️投票所",
    href: "https://vote.nijiurachan.net/",
    external: true,
  },
  { label: "🎵ジュークボックス", href: "/jukebox", external: false },
];

const UTILITY_LINKS: HeaderLink[] = [
  { label: "🏛️過去ログ", href: "/archive" },
  { label: "Wiki", href: "https://wiki.nijiurachan.net/" },
  { label: "📡API", href: "/api-docs" },
  { label: "ホーム", href: "/" },
];

export const DesktopHeader: React.FunctionComponent = () => {
  const location = useLocation();
  const isThreadView = location.pathname.startsWith("/thread/");
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);

  return (
    <header className="desktop-header">
      <nav className="desktop-header-links" aria-label="外部サービス">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            onClick={
              link.label.startsWith("🎵")
                ? (event: React.MouseEvent<HTMLAnchorElement>): void => {
                    event.preventDefault();
                    setIsJukeboxOpen(true);
                  }
                : undefined
            }
          >
            [{link.label}]
          </a>
        ))}
      </nav>

      <div className="desktop-header-title">
        <img
          className="desktop-header-mascot"
          src={mascot}
          alt=""
          aria-hidden="true"
        />
        二次元裏@αimg(あいもげ)
      </div>

      <nav className="desktop-header-utilities" aria-label="サイトメニュー">
        {isThreadView && (
          <span className="desktop-header-current">スレッド</span>
        )}
        {UTILITY_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={
              link.href.startsWith("http") ? "noopener noreferrer" : undefined
            }
          >
            [{link.label}]
          </a>
        ))}
        <SearchBar />
      </nav>

      {isJukeboxOpen && (
        <div className="desktop-jukebox-notice" aria-live="polite">
          ジュークボックスは別ページで開きます。<a href="/jukebox">開く</a>
          <button type="button" onClick={(): void => setIsJukeboxOpen(false)}>
            閉じる
          </button>
        </div>
      )}
    </header>
  );
};
