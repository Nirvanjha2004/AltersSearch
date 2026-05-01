"use client";

import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Paperclip,
  Mic,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Sidebar, { type ChatItem } from "../components/Sidebar";
import { ResultsGrid } from "../components/ResultsGrid";
import SearchChips from "../components/SearchChips";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import type { AgentResponse, SearchResult } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 64;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function getFirstName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const part  = local.split(/[._-]/)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchPage
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { user } = useAuth();

  // ── Sidebar state ──────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>();

  // ── Search state ───────────────────────────────────────────────────────
  const [inputValue, setInputValue]   = useState("");
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [viewState, setViewState]     = useState<"empty" | "loading" | "results">("empty");
  const [clarification, setClarification] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Sidebar width for main-content offset ──────────────────────────────
  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  // ── Auto-resize textarea ───────────────────────────────────────────────
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // ── Search ─────────────────────────────────────────────────────────────
  // Core search — adds to chat list ONLY on success
  const runSearch = useCallback(async (query: string, chatId?: string) => {
    setError(null);
    setClarification(null);
    setIsLoading(true);
    setViewState("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`Search API responded with status ${res.status}`);

      const data = (await res.json()) as AgentResponse;

      if (data.status === "clarification_needed") {
        // Don't add to chat list — still waiting for a real result
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

      // Success — now add/confirm the chat entry
      if (chatId) {
        // New search: add the entry now that we have results
        setChats((prev) => [{ id: chatId, title: query }, ...prev].slice(0, 20));
        setActiveChatId(chatId);
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
  }, []);

  // New search from input — generates a chat ID and passes it to runSearch
  const handleSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query) return;
    const chatId = `chat-${Date.now()}`;
    await runSearch(query, chatId);
  }, [runSearch]);

  const handleSubmit = () => {
    if (inputValue.trim()) handleSearch(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setViewState("empty");
    setResults([]);
    setError(null);
    setClarification(null);
    setInputValue("");
    setActiveChatId(undefined);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setInputValue(chat.title);
      void runSearch(chat.title);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const greeting  = getGreeting();
  const firstName = user ? getFirstName(user.email) : "there";

  return (
    <ProtectedRoute>
      <div className="app-shell">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* ── Main content — offset tracks sidebar width ──────────────── */}
        <motion.div
          className="main-content"
          animate={{ marginLeft: sidebarW }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <AnimatePresence mode="wait">

            {/* ── Empty / Loading hero ──────────────────────────────── */}
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
                      <Sparkles size={26} className="text-[var(--accent)]" />
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
                  {error && (
                    <div role="alert" className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
                      onChange={(e) => { setInputValue(e.target.value); autoResize(); }}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      aria-label="Search query"
                      disabled={isLoading}
                    />
                    <div className="input-bottom-row">
                      <div className="input-bottom-left">
                        <button type="button" aria-label="Attach file" className="input-icon-btn">
                          <Paperclip size={14} />
                        </button>
                        <button type="button" aria-label="Select model" className="flex items-center gap-1.5 h-[30px] px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent text-[var(--text-muted)] text-xs hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all">
                          <span>Vector Search</span>
                          <ChevronDown size={11} />
                        </button>
                      </div>
                      <div className="input-bottom-right">
                        <button type="button" aria-label="Voice input" className="input-icon-btn">
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
                          {isLoading
                            ? <span className="spinner-sm" aria-hidden="true" />
                            : <ArrowUp size={15} />
                          }
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Smart search chips */}
                  <SearchChips
                    onSelect={(query) => {
                      setInputValue(query);
                      textareaRef.current?.focus();
                      void handleSearch(query);
                    }}
                  />
                </motion.div>

                {/* Skeleton while loading */}
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

            {/* ── Results ───────────────────────────────────────────── */}
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
                          onClick={handleNewChat}
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
                          {isLoading
                            ? <span className="spinner-sm" aria-hidden="true" />
                            : <ArrowUp size={15} />
                          }
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="results-header">
                  <p className="results-count">
                    {results.length} {results.length === 1 ? "result" : "results"} found
                  </p>
                </div>

                <ResultsGrid results={results} isLoading={false} />
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
