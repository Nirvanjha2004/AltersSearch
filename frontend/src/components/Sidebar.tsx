type SidebarProps = {
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onNewSearch: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({
  recentSearches,
  onSelectSearch,
  onNewSearch,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${isMobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-section">
          <button className="new-search-btn" type="button" onClick={onNewSearch}>
            <span>+ New Search</span>
          </button>
        </div>

        <div className="sidebar-section sidebar-list">
          <p className="sidebar-title">Recent Searches</p>
          {recentSearches.length === 0 ? (
            <p className="sidebar-empty">No searches yet</p>
          ) : (
            <ul className="history-list">
              {recentSearches.map((query) => (
                <li key={query}>
                  <button className="history-item" type="button" onClick={() => onSelectSearch(query)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M12 7v5l3 3M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{query}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="icon-button" type="button" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M10.3 4.3a1 1 0 0 1 1.4-.6l.7.3a1 1 0 0 0 1 0l.7-.3a1 1 0 0 1 1.4.6l.4.8a1 1 0 0 0 .8.6l.9.1a1 1 0 0 1 .9 1v.8a1 1 0 0 0 .5.9l.8.5a1 1 0 0 1 .4 1.4l-.4.7a1 1 0 0 0 0 1l.4.7a1 1 0 0 1-.4 1.4l-.8.5a1 1 0 0 0-.5.9v.8a1 1 0 0 1-.9 1l-.9.1a1 1 0 0 0-.8.6l-.4.8a1 1 0 0 1-1.4.6l-.7-.3a1 1 0 0 0-1 0l-.7.3a1 1 0 0 1-1.4-.6l-.4-.8a1 1 0 0 0-.8-.6l-.9-.1a1 1 0 0 1-.9-1v-.8a1 1 0 0 0-.5-.9l-.8-.5a1 1 0 0 1-.4-1.4l.4-.7a1 1 0 0 0 0-1l-.4-.7a1 1 0 0 1 .4-1.4l.8-.5a1 1 0 0 0 .5-.9v-.8a1 1 0 0 1 .9-1l.9-.1a1 1 0 0 0 .8-.6l.4-.8Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
          <span className="plan-pill">Free</span>
        </div>
      </aside>
      {isMobileOpen ? <button className="mobile-backdrop" onClick={onCloseMobile} aria-label="Close navigation" /> : null}
    </>
  );
}
