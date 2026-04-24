import { motion } from "framer-motion";
import { Clock3, Compass, Plus, Settings2, Sparkles } from "lucide-react";

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
      <aside className={`sidebar ${isMobileOpen ? "sidebar-open" : ""}`}>
        <div className="p-4 pb-2">
          <div className="mb-3 rounded-xl bg-[var(--bg-elevated)] p-3">
            <p className="m-0 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              <Sparkles size={11} />
              Workspace
            </p>
            <p className="mt-1 mb-0 text-sm font-medium text-[var(--text-primary)]">Discover repositories faster</p>
          </div>
          <motion.button
            className="group relative h-10 w-full overflow-hidden rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[linear-gradient(120deg,var(--accent),var(--accent-hover))] text-sm font-medium text-white shadow-[0_10px_24px_rgba(109,40,217,0.26)]"
            type="button"
            onClick={onNewSearch}
            whileHover={{ scale: 1.015, filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_60px_at_20%_-20%,rgba(255,255,255,0.35),transparent_55%)] opacity-80" />
            <span className="relative inline-flex items-center gap-2">
              <Plus size={15} />
              New Search
            </span>
          </motion.button>
        </div>

        <div className="p-4 pt-3">
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
            <Compass size={12} />
            Recent Searches
          </p>
          {recentSearches.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No searches yet</p>
          ) : (
            <ul className="space-y-2">
              {recentSearches.map((query) => (
                <li key={query}>
                  <motion.button
                    className={`history-item w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      activeQuery === query
                        ? "border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-[0_8px_20px_rgba(91,33,182,0.18)]"
                        : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                    type="button"
                    onClick={() => onSelectSearch(query)}
                    whileHover={{ x: 2 }}
                  >
                    <Clock3 size={14} aria-hidden="true" />
                    <span>{query}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--bg-border)] p-4">
          <motion.button className="icon-button" type="button" aria-label="Settings" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Settings2 size={16} aria-hidden="true" />
          </motion.button>
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)]">Free</span>
        </div>
      </aside>
      {isMobileOpen ? <button className="mobile-backdrop" onClick={onCloseMobile} aria-label="Close navigation" /> : null}
    </>
  );
}
