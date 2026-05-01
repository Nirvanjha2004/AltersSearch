"use client";

import { Clock3, Compass, Plus, Settings2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SidebarProps {
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onNewSearch: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({
  recentSearches,
  onSelectSearch,
  onNewSearch,
  isOpen,
  onClose,
}: SidebarProps) {
  // Limit to 12 recent searches as per spec
  const visibleSearches = recentSearches.slice(0, 12);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar panel                                                       */}
      {/* ------------------------------------------------------------------ */}
      <aside
        aria-hidden={!isOpen}
        aria-label="Sidebar navigation"
        className={cn(
          // Base layout
          "flex w-[240px] flex-shrink-0 flex-col",
          // Desktop: sticky below topbar, always visible
          "sticky top-[56px] max-h-[calc(100vh-56px)] overflow-y-auto",
          // Scrollbar hidden
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Colors & border
          "border-r border-[var(--border)]",
        )}
        style={{
          background: "var(--card-bg)",
          // Mobile: fixed, slide in/out via transform
          // We use inline style for the responsive transform because Tailwind
          // doesn't have a built-in 960px breakpoint class.
        }}
      >
        {/* Inner wrapper — handles mobile positioning via a CSS class approach */}
        <div
          className={cn(
            "flex h-full w-full flex-col",
            // On mobile (< 960px) the aside itself becomes fixed and slides
            // We apply the mobile styles via a wrapper that uses media queries
          )}
        >
          {/* ---------------------------------------------------------------- */}
          {/* Workspace section                                                */}
          {/* ---------------------------------------------------------------- */}
          <div className="p-4 pb-2">
            <div className="mb-3 rounded-xl bg-[var(--bg-elevated,#1a1a2e)] p-3">
              <p className="m-0 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
                <Sparkles size={11} aria-hidden="true" />
                Workspace
              </p>
              <p className="mb-0 mt-1 text-sm font-medium text-[var(--text-primary)]">
                Discover repositories faster
              </p>
            </div>

            {/* "+ New Search" button */}
            <motion.button
              type="button"
              onClick={onNewSearch}
              whileHover={{ scale: 1.015, filter: "brightness(1.06)" }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative h-10 w-full overflow-hidden rounded-xl",
                "border border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)]",
                "text-sm font-medium text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              )}
              style={{
                background: "linear-gradient(120deg, var(--accent), var(--accent-hover, #6d28d9))",
                boxShadow: "0 10px 24px rgba(109, 40, 217, 0.26)",
              }}
              aria-label="Start a new search"
            >
              {/* Shimmer overlay */}
              <span
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{
                  background:
                    "radial-gradient(300px 60px at 20% -20%, rgba(255,255,255,0.35), transparent 55%)",
                }}
                aria-hidden="true"
              />
              <span className="relative inline-flex items-center gap-2">
                <Plus size={15} aria-hidden="true" />
                New Search
              </span>
            </motion.button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Recent Searches section                                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-1 p-4 pt-3">
            <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
              <Compass size={12} aria-hidden="true" />
              Recent Searches
            </p>

            {visibleSearches.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No searches yet</p>
            ) : (
              <ul className="space-y-1.5" role="list" aria-label="Recent searches">
                {visibleSearches.map((query) => (
                  <li key={query}>
                    <motion.button
                      type="button"
                      onClick={() => onSelectSearch(query)}
                      whileHover={{ x: 2 }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border border-transparent",
                        "px-3 py-2 text-left text-sm text-[var(--text-secondary,#9ca3af)]",
                        "transition-colors duration-100",
                        "hover:border-[var(--border)] hover:bg-[var(--bg-elevated,#1a1a2e)] hover:text-[var(--text-primary)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                      )}
                    >
                      <Clock3 size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      <span className="truncate">{query}</span>
                    </motion.button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Footer: settings + Free badge                                    */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center justify-between border-t border-[var(--border)] p-4">
            <motion.button
              type="button"
              aria-label="Settings"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md",
                "border border-[var(--border)] bg-transparent text-[var(--text-muted)]",
                "transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              )}
            >
              <Settings2 size={16} aria-hidden="true" />
            </motion.button>

            {/* "Free" badge in --accent color */}
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 28%, transparent)",
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            >
              Free
            </span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile backdrop overlay — only rendered when sidebar is open       */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="mobile-backdrop fixed inset-0 z-[54] border-0 bg-black/45"
          style={{ top: "56px" }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Mobile slide-in styles injected via a <style> tag                  */}
      {/* The spec requires < 960px breakpoint which isn't a standard        */}
      {/* Tailwind breakpoint, so we use a scoped style block.               */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @media (max-width: 959px) {
          aside[aria-label="Sidebar navigation"] {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            height: calc(100vh - 56px) !important;
            z-index: 55;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
          }
          aside[aria-label="Sidebar navigation"][aria-hidden="false"] {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
