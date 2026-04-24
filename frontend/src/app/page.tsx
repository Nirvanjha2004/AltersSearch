"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnswerCard from "../components/AnswerCard";
import ClarificationCard from "../components/ClarificationCard";
import EmptyState from "../components/EmptyState";
import EnrichmentPill from "../components/EnrichmentPill";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import SkeletonCard from "../components/SkeletonCard";
import Topbar from "../components/Topbar";
import type { AgentResponse, SearchRequest, SearchResult } from "../types";

type ViewState = "search" | "clarification" | "results";
type RouteMode = "vector_search" | "web_search" | "clarify";

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [originalQuery, setOriginalQuery] = useState("");
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [clarificationPrefill, setClarificationPrefill] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("vector_search");
  const [enrichedQuery, setEnrichedQuery] = useState("");

  const title = useMemo(() => {
    if (viewState === "clarification") {
      return "Need one more detail";
    }
    if (viewState === "results") {
      return "Search results";
    }
    return "Open Source Search";
  }, [viewState]);

  const pushRecentSearch = (query: string) => {
    setRecentSearches((previous) => [query, ...previous.filter((item) => item !== query)].slice(0, 12));
  };

  const callSearchApi = async (payload: SearchRequest): Promise<AgentResponse> => {
    const response = await fetch("http://localhost:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Search API failed with status ${response.status}`);
    }

    return (await response.json()) as AgentResponse;
  };

  const applyResponse = (data: AgentResponse, fallbackQuery: string) => {
    setRouteMode((data.action as RouteMode) || "vector_search");
    setEnrichedQuery(data.enriched_query || "");
    setAnswer(data.answer || null);

    if (data.status === "clarification_needed") {
      const question = data.message || "Could you be more specific?";
      const prefill = `Original intent: ${fallbackQuery}. Clarification: `;
      setClarificationQuestion(question);
      setClarificationPrefill(prefill);
      setViewState("clarification");
      setResults([]);
      return;
    }

    if (data.status === "error") {
      setErrorMessage(data.message || "Search failed. Please try again.");
      setResults([]);
      setViewState("results");
      return;
    }

    setResults(data.results ?? []);
    setViewState("results");
  };

  const runSearch = async (query: string, options?: { preserveOriginal?: boolean }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setMobileNavOpen(false);

    if (!options?.preserveOriginal) {
      setOriginalQuery(query);
    }
    pushRecentSearch(query);

    try {
      const data = await callSearchApi({ query });
      applyResponse(data, options?.preserveOriginal ? originalQuery : query);
    } catch {
      setErrorMessage("Could not reach the backend. Ensure FastAPI is running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSearch = async (query: string) => {
    await runSearch(query);
  };

  const handleClarificationSearch = async (query: string) => {
    await runSearch(query, { preserveOriginal: true });
  };

  const handleSuggestion = async (suggestion: string) => {
    await handleInitialSearch(suggestion);
  };

  const resetSearch = () => {
    setViewState("search");
    setResults([]);
    setErrorMessage(null);
    setAnswer(null);
    setEnrichedQuery("");
    setRouteMode("vector_search");
  };

  const sourceForAnswer = results.find((item) => item.url)?.url;

  return (
    <div className="app-shell bg-[radial-gradient(1200px_700px_at_70%_-20%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(900px_500px_at_0%_20%,rgba(59,130,246,0.14),transparent_45%),#0a0a0a]">
      <Topbar onToggleMobileNav={() => setMobileNavOpen((value) => !value)} />
      <div className="content-shell">
        <Sidebar
          recentSearches={recentSearches}
          onSelectSearch={handleInitialSearch}
          onNewSearch={resetSearch}
          isMobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          activeQuery={originalQuery}
        />

        <main className="main-area">
          <div className="main-inner max-w-[760px] px-6 py-10 md:px-8">
            {errorMessage ? (
              <motion.div className="error-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {errorMessage}
              </motion.div>
            ) : null}

            <AnimatePresence mode="wait">
              {viewState === "search" ? (
                <motion.div key="search" className="landing-wrap gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState onSuggestionClick={handleSuggestion} />
                  <SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} routeMode={routeMode} autoFocus />
                  {isLoading ? (
                    <div className="skeleton-stack">
                      {[0, 1, 2].map((index) => (
                        <SkeletonCard key={index} index={index} />
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              {viewState === "clarification" ? (
                <motion.section key="clarification" className="result-area" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <ClarificationCard question={clarificationQuestion} />
                  <SearchBar
                    onSubmit={handleClarificationSearch}
                    isLoading={isLoading}
                    routeMode="clarify"
                    initialValue={clarificationPrefill}
                    autoFocus
                  />
                  {isLoading ? (
                    <div className="skeleton-stack">
                      {[0, 1, 2].map((index) => (
                        <SkeletonCard key={index} index={index} />
                      ))}
                    </div>
                  ) : null}
                </motion.section>
              ) : null}

              {viewState === "results" ? (
                <motion.section key="results" className="result-area" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <h1 className="m-0 text-[24px] font-semibold tracking-tight text-zinc-100">{title}</h1>
                  <SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} routeMode={routeMode} />

                  {isLoading ? (
                    <div className="skeleton-stack">
                      {[0, 1, 2].map((index) => (
                        <SkeletonCard key={index} index={index} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {enrichedQuery ? <EnrichmentPill query={enrichedQuery} /> : null}
                      {answer ? <AnswerCard answer={answer} source={sourceForAnswer} /> : null}

                      {results.length === 0 ? (
                        <div className="empty-results">
                          <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" style={{ color: "var(--text-muted)" }}>
                            <path d="m15.5 15.5 4 4M10 18a8 8 0 1 1 5.3-14l-2.5 2.6M9 9h6m-6 4h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <h3>No results found</h3>
                          <p>Try a different query or search the web</p>
                        </div>
                      ) : (
                        <div className="results-grid">
                          {results.map((result, index) => (
                            <ResultCard key={`${result.url}-${index}`} result={result} index={index} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
