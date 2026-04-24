type TopbarProps = {
  onToggleMobileNav: () => void;
};

export default function Topbar({ onToggleMobileNav }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-only" aria-label="Open navigation" onClick={onToggleMobileNav}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="brand">AltersSearch</span>
        <span className="beta-badge">beta</span>
      </div>

      <div className="topbar-right">
        <button className="ghost-button" type="button">
          <span className="feedback-text">Give feedback</span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 16h8M8 12h8M8 8h8M4 5.2V20l3.6-2.5H20V5.2c0-.66-.54-1.2-1.2-1.2H5.2C4.54 4 4 4.54 4 5.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="avatar" aria-label="User menu" type="button">NJ</button>
      </div>
    </header>
  );
}
