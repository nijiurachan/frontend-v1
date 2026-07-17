import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import mascot from "@/assets/img/icon_aimoge.webp";
import { SearchBar } from "@/features/catalog/components";

type AppPath = "/" | "/archive" | "/jukebox";

interface AppHeaderLink {
  label: string;
  to: AppPath;
  href?: never;
  external?: never;
}

interface AnchorHeaderLink {
  label: string;
  href: string;
  external?: boolean;
  to?: never;
}

type HeaderLink = AppHeaderLink | AnchorHeaderLink;

const NAV_LINKS: HeaderLink[] = [
  { label: "FANBOX", href: "https://aimoge.fanbox.cc/", external: true },
  {
    label: "🗳️投票所",
    href: "https://vote.nijiurachan.net/",
    external: true,
  },
  { label: "🎵ジュークボックス", to: "/jukebox" },
];

const UTILITY_LINKS: HeaderLink[] = [
  { label: "🏛️過去ログ", to: "/archive" },
  { label: "Wiki", href: "https://wiki.nijiurachan.net/", external: true },
  { label: "📡API", href: "/api-docs" },
  { label: "ホーム", to: "/" },
];

export const DesktopHeader: React.FunctionComponent = () => {
  const location = useLocation();
  const isThreadView = location.pathname.startsWith("/thread/");
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);

  return (
    <header className="desktop-header">
      <nav className="desktop-header-links" aria-label="外部サービス">
        {NAV_LINKS.map((link) => (
          <HeaderLinkItem
            key={link.label}
            link={link}
            onClick={
              link.label.startsWith("🎵")
                ? (event: React.MouseEvent<HTMLAnchorElement>): void => {
                    event.preventDefault();
                    setIsJukeboxOpen(true);
                  }
                : undefined
            }
          />
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
          <HeaderLinkItem key={link.label} link={link} />
        ))}
        <SearchBar />
      </nav>

      {isJukeboxOpen && (
        <div className="desktop-jukebox-notice" aria-live="polite">
          ジュークボックスは別ページで開きます。
          <Link to="/jukebox">開く</Link>
          <button type="button" onClick={(): void => setIsJukeboxOpen(false)}>
            閉じる
          </button>
        </div>
      )}
    </header>
  );
};

interface HeaderLinkItemProps {
  link: HeaderLink;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const HeaderLinkItem: React.FunctionComponent<HeaderLinkItemProps> = ({
  link,
  onClick,
}: HeaderLinkItemProps) => {
  if (link.to) {
    return (
      <Link to={link.to} onClick={onClick}>
        [{link.label}]
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noopener noreferrer" : undefined}
      onClick={onClick}
    >
      [{link.label}]
    </a>
  );
};
