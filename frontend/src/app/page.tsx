"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Paperclip,
  Mic,
  ChevronDown,
  Sparkles,
  Code2,
  PenLine,
  BookOpen,
  Smile,
  Zap,
} from "lucide-react";
import IconSidebar from "../components/IconSidebar";
import { ResultsGrid } from "../components/ResultsGrid";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/cn";
import type { AgentResponse, SearchResult } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Action pills config
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_PILLS = [
  { id: "code",    label: "Code",        icon: <Code2 size={13} /> },
  { id: "write",   label: "Write",       icon: <PenLine size={13} /> },
  { id: "learn",   label: "Learn",       icon: <BookOpen size={13} /> },
  { id: "life",    label: "Life stuff",  icon: <Smile size={13} /> },
  { id: "ai",      label: "AI tools",    icon: <Zap size={13} /> },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function getFirstName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const name = local.split(/[._-]/)[0] ?? local;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchPage
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"empty" | "loading" | "results">("empty");
  const [clarification, setClarification] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("search");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────

  const pushRecentSearch = (q: string) => {
    setRecentSearches((prev) =>
      [q, ...prev.filter((item) => item !== q)].slice(0, 12)
    );
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // ── Search ─────────────────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    const query = q.trim();
    if (!query) return;

    pushRecentSearch(query);
    setError(null);
    setClarification(null);
    setIsLoading(true);
    setViewState("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
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

      setResults(data.results ?? []);
      setViewState("results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the backend. Ensure FastAPI is running on port 8000."
      );
      setResults([]);
      setViewState("empty");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      handleSearch(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePillClick = (label: string) => {
    setInputValue(label);
    textareaRef.current?.focus();
  };

  const handleNewSearch = () => {
    setViewState("empty");
    setResults([]);
    setError(null);
    setClarification(null);
    setInputValue("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const greeting = getGreeting();
  const firstName = user ? getFirstName(user.email) : "there";

  return (
    <ProtectedRoute>
      <div className="app-shell">
        {/* Icon Sidebar */}
        <IconSidebar activeItem={activeNav} onItemClick={setActiveNav} />

        {/* Main content */}
        <div className="main-content">
          <AnimatePresence mode="wait">

            {/* ── Empty / Hero state ──────────────────────────────────── */}
            {(viewState === "empty" || viewState === "loading") && (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="search-hero"
              >
                {/* Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="text-center mb-10"
                >
                  <h1 className="hero-greeting">
                    {greeting}, {firstName}
                    <motion.span
                      animate={{ rotate: [0, 15, -10, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="inline-block"
                      aria-hidden="true"
                    >
                      <Sparkles size={28} className="text-[var(--accent)]" />
                    </motion.span>
                  </h1>
                  <p className="hero-sub">Find the right repository. Instantly.</p>
                </motion.div>

                {/* Input card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-full max-w-[680px]"
                >
                  {/* Error / clarification banners */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-3 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400"
                    >
                      {error}
                    </div>
                  )}
                  {clarification && (
                    <div className="mb-3 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
                      <span className="font-medium text-[var(--accent)]">Clarification: </span>
                      {clarification}
                    </div>
                  )}

                  <div className="input-card">
                    <textarea
                      ref={textareaRef}
                      className="input-textarea"
                      placeholder="How can I help you today?"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        autoResize();
                      }}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      aria-label="Search query"
                      disabled={isLoading}
                    />

                    <div className="input-bottom-row">
                      {/* Left: attachment */}
                      <div className="input-bottom-left">
                        <button
                          type="button"
                          aria-label="Attach file"
                          className="input-icon-btn"
                        >
                          <Paperclip size={14} />
                        </button>

                        {/* Model selector */}
                        <button
                          type="button"
                          aria-label="Select model"
                          className="flex items-center gap-1.5 h-[30px] px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent text-[var(--text-muted)] text-xs hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <span>Vector Search</span>
                          <ChevronDown size={11} />
                        </button>
                      </div>

                      {/* Right: voice + send */}
                      <div className="input-bottom-right">
                        <button
                          type="button"
                          aria-label="Voice input"
                          className="input-icon-btn"
                        >
                          <Mic size={14} />
                        </button>

                        <motion.button
                          type="button"
                          aria-label="Submit search"
                          onClick={handleSubmit}
                          disabled={isLoading || !inputValue.trim()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.93 }}
                          className="send-btn"
                        >
                          {isLoading ? (
                            <span className="spinner-sm" aria-hidden="true" />
                          ) : (
                            <ArrowUp size={15} />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Action pills */}
                  <div className="action-pills">
                    {ACTION_PILLS.map((pill) => (
                      <motion.button
                        key={pill.id}
                        type="button"
                        onClick={() => handlePillClick(pill.label)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="action-pill"
                      >
                        {pill.icon}
                        {pill.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Loading skeleton */}
                {viewState === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-[680px] mt-8"
                  >
                    <ResultsGrid results={[]} isLoading={true} />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Results state ───────────────────────────────────────── */}
            {viewState === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="results-area"
              >
                {/* Inline search bar */}
                <div className="mb-6 max-w-[680px]">
                  <div className="input-card">
                    <textarea
                      className="input-textarea"
                      placeholder="Refine your search…"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      aria-label="Refine search"
                    />
                    <div className="input-bottom-row">
                      <div className="input-bottom-left">
                        <button
                          type="button"
                          onClick={handleNewSearch}
                          className="flex items-center gap-1.5 h-[30px] px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent text-[var(--text-muted)] text-xs hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
                        >
                          ← New search
                        </button>
                      </div>
                      <div className="input-bottom-right">
                        <motion.button
                          type="button"
                          aria-label="Submit search"
                          onClick={handleSubmit}
                          disabled={isLoading || !inputValue.trim()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.93 }}
                          className="send-btn"
                        >
                          {isLoading ? (
                            <span className="spinner-sm" aria-hidden="true" />
                          ) : (
                            <ArrowUp size={15} />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results count */}
                <div className="results-header">
                  <p className="results-count">
                    {results.length} {results.length === 1 ? "result" : "results"} found
                  </p>
                </div>

                <ResultsGrid results={results} isLoading={false} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}
