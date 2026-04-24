import { motion } from "framer-motion";

type SidebarProps = {
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onNewSearch: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeQuery?: string;
};

export default function Sidebar({
  recentSearches,
  onSelectSearch,
  onNewSearch,
  isMobileOpen,
  onCloseMobile,
  activeQuery,
}: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${isMobileOpen ? "sidebar-open" : ""} border-r border-white/10 bg-zinc-950/85 backdrop-blur-xl`}>
        <div className="p-4">
          <motion.button
            className="h-10 w-full rounded-xl border border-violet-500/35 bg-gradient-to-b from-violet-500/20 to-violet-500/10 text-sm font-medium text-violet-200 shadow-[0_8px_20px_rgba(76,29,149,0.25)]"
            type="button"
            onClick={onNewSearch}
            whileHover={{ scale: 1.015, filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.98 }}
          >
            + New Search
          </motion.button>
        </div>

        <div className="p-4 pt-2">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">Recent Searches</p>
          {recentSearches.length === 0 ? (
            <p className="text-sm text-zinc-600">No searches yet</p>
          ) : (
            <ul className="space-y-2">
              {recentSearches.map((query) => (
                <li key={query}>
                  <motion.button
                    className={`history-item w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      activeQuery === query
                        ? "border-violet-500/40 bg-violet-500/12 text-zinc-100"
                        : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                    type="button"
                    onClick={() => onSelectSearch(query)}
                    whileHover={{ x: 2 }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M12 7v5l3 3M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{query}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 p-4">
          <motion.button className="icon-button" type="button" aria-label="Settings" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M10.3 4.3a1 1 0 0 1 1.4-.6l.7.3a1 1 0 0 0 1 0l.7-.3a1 1 0 0 1 1.4.6l.4.8a1 1 0 0 0 .8.6l.9.1a1 1 0 0 1 .9 1v.8a1 1 0 0 0 .5.9l.8.5a1 1 0 0 1 .4 1.4l-.4.7a1 1 0 0 0 0 1l.4.7a1 1 0 0 1-.4 1.4l-.8.5a1 1 0 0 0-.5.9v.8a1 1 0 0 1-.9 1l-.9.1a1 1 0 0 0-.8.6l-.4.8a1 1 0 0 1-1.4.6l-.7-.3a1 1 0 0 0-1 0l-.7.3a1 1 0 0 1-1.4-.6l-.4-.8a1 1 0 0 0-.8-.6l-.9-.1a1 1 0 0 1-.9-1v-.8a1 1 0 0 0-.5-.9l-.8-.5a1 1 0 0 1-.4-1.4l.4-.7a1 1 0 0 0 0-1l-.4-.7a1 1 0 0 1 .4-1.4l.8-.5a1 1 0 0 0 .5-.9v-.8a1 1 0 0 1 .9-1l.9-.1a1 1 0 0 0 .8-.6l.4-.8Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </motion.button>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">Free</span>
        </div>
      </aside>
      {isMobileOpen ? <button className="mobile-backdrop" onClick={onCloseMobile} aria-label="Close navigation" /> : null}
    </>
  );
}
