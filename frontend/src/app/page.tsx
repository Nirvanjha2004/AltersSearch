"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import SuggestionChips from "../components/SuggestionChips";
import { VectorSearchToggle } from "../components/VectorSearchToggle";
import { ResultsGrid } from "../components/ResultsGrid";
import ProtectedRoute from "../components/ProtectedRoute";
import type { AgentResponse, SearchResult } from "../types";

// ---------------------------------------------------------------------------
// SearchPage
// ---------------------------------------------------------------------------

export default function SearchPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"empty" | "loading" | "results">("empty");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Push a query to the recent-searches list (deduplicated, max 12, most-recent-first). */
  const pushRecentSearch = (q: string) => {
    setRecentSearches((prev) =>
      [q, ...prev.filter((item) => item !== q)].slice(0, 12)
    );
  };

  // ── Search handler ───────────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;

    // Update query state and recent searches
    setQuery(q);
    pushRecentSearch(q);

    // Transition to loading view
    setError(null);
    setClarification(null);
    setIsLoading(true);
    setViewState("loading");

    try {
      const response = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!response.ok) {
        throw new Error(`Search API responded with status ${response.status}`);
      }

      const data = (await response.json()) as AgentResponse;

      if (data.status === "clarification_needed") {
        setClarification(data.clarification_question ?? data.message ?? null);
        setResults([]);
        setViewState("empty");
        return;
      }

      if (data.status === "error") {
        setError(data.message || "Search failed. Please try again.");
        setResults([]);
        setViewState("empty");
        return;
      }

      // success
      setResults(data.results ?? []);
      setViewState("results");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not reach the backend. Ensure FastAPI is running on port 8000.";
      setError(message);
      setResults([]);
      setViewState("empty");
    } finally {
      setIsLoading(false);
    }
  };

  /** Called when a suggestion chip is clicked — populate query and search immediately. */
  const handleChipSelect = (chip: string) => {
    setQuery(chip);
    void handleSearch(chip);
  };

  /** Called from Sidebar "New Search" button — reset to empty state. */
  const handleNewSearch = () => {
    setViewState("empty");
    setResults([]);
    setError(null);
    setClarification(null);
    setQuery("");
  };

  /** Called from Sidebar recent-search item — re-run that query. */
  const handleSelectSearch = (q: string) => {
    setSidebarOpen(false);
    void handleSearch(q);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        {/* Subtle dot-grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(var(--border) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
          aria-hidden="true"
        />

        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />

        {/* ── Content shell: Sidebar + Main ──────────────────────────────── */}
        <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
          {/* Sidebar */}
          <Sidebar
            recentSearches={recentSearches}
            onSelectSearch={handleSelectSearch}
            onNewSearch={handleNewSearch}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main content area */}
          <main className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="mx-6 mt-6 rounded-lg border px-4 py-3 text-sm"
                style={{
                  borderColor: "color-mix(in srgb, var(--error, #ef4444) 45%, var(--border))",
                  background: "color-mix(in srgb, var(--error, #ef4444) 12%, transparent)",
                  color: "color-mix(in srgb, var(--error, #ef4444) 70%, var(--text-primary))",
                }}
              >
                {error}
              </div>
            )}

            {/* Clarification banner */}
            {clarification && (
              <div
                className="mx-6 mt-6 rounded-lg border px-4 py-3 text-sm"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent) 40%, var(--border))",
                  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="font-medium text-[var(--accent)]">Clarification needed: </span>
                {clarification}
              </div>
            )}

            {/* ── Animated view transitions ─────────────────────────────── */}
            <AnimatePresence mode="wait">
              {/* ── Empty hero ───────────────────────────────────────────── */}
              {viewState === "empty" && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center gap-8 px-6 py-16"
                  style={{ minHeight: "calc(100vh - 160px)" }}
                >
                  {/* Hero heading */}
                  <div className="text-center space-y-3">
                    <h1
                      className="text-5xl font-bold tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      AltersSearch
                    </h1>
                    <p
                      className="text-lg"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Find the right repo. Instantly.
                    </p>
                  </div>

                  {/* Suggestion chips */}
                  <SuggestionChips onSelect={handleChipSelect} />

                  {/* Search bar */}
                  <div className="w-full max-w-[680px]">
                    <SearchBar
                      onSubmit={handleSearch}
                      isLoading={isLoading}
                      initialValue={query}
                    />
                  </div>

                  {/* Vector search toggle */}
                  <VectorSearchToggle />
                </motion.div>
              )}

              {/* ── Loading view (skeleton grid) ─────────────────────────── */}
              {viewState === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 py-8"
                >
                  <ResultsGrid results={[]} isLoading={true} />
                </motion.div>
              )}

              {/* ── Results view ─────────────────────────────────────────── */}
              {viewState === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-6 py-8"
                >
                  {/* Inline search bar at top of results */}
                  <div className="mb-6 max-w-[680px]">
                    <SearchBar
                      onSubmit={handleSearch}
                      isLoading={isLoading}
                      initialValue={query}
                    />
                  </div>

                  {/* Results grid */}
                  <ResultsGrid results={results} isLoading={false} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
