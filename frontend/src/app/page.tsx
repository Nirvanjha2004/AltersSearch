"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnswerCard from "../components/AnswerCard";
import ClarificationCard from "../components/ClarificationCard";
import EmptyState from "../components/EmptyState";
import EnrichmentPill from "../components/EnrichmentPill";
import FiltersPanel from "../components/FiltersPanel";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import SkeletonCard from "../components/SkeletonCard";
import Topbar from "../components/Topbar";
import type { AgentResponse, SearchRequest, SearchResult } from "../types";

type ViewState = "search" | "clarification" | "results";
type RouteMode = "vector_search" | "web_search" | "clarify";

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
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
  const [sortBy, setSortBy] = useState<"stars" | "forks" | "pushed" | "created">("stars");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterArchived, setFilterArchived] = useState<"all" | "yes" | "no">("all");
  const [filterFork, setFilterFork] = useState<"all" | "yes" | "no">("all");
  const [clientSearch, setClientSearch] = useState("");

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

  const uniqueDomains = useMemo(() => {
    const values = new Set(results.map((result) => result.domain).filter(Boolean));
    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [results]);

  const uniqueLanguages = useMemo(() => {
    const values = new Set(results.map((result) => result.language).filter(Boolean) as string[]);
    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [results]);

  const filteredResults = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();

    const list = results.filter((repo) => {
      if (filterDomain !== "all" && repo.domain !== filterDomain) return false;
      if (filterLanguage !== "all" && (repo.language || "Unknown") !== filterLanguage) return false;

      if (filterArchived === "yes" && !repo.is_archived) return false;
      if (filterArchived === "no" && repo.is_archived) return false;

      if (filterFork === "yes" && !repo.is_fork) return false;
      if (filterFork === "no" && repo.is_fork) return false;

      if (!query) return true;

      const text = `${repo.repo_name || ""} ${repo.full_name || ""} ${repo.description || ""}`.toLowerCase();
      return query
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => text.includes(term));
    });

    const getDate = (value?: string) => {
      if (!value) return 0;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [...list].sort((a, b) => {
      if (sortBy === "stars") return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (sortBy === "forks") return (b.forks_count || 0) - (a.forks_count || 0);
      if (sortBy === "pushed") return getDate(b.github_pushed_at) - getDate(a.github_pushed_at);
      return getDate(b.github_created_at) - getDate(a.github_created_at);
    });
  }, [results, clientSearch, filterDomain, filterLanguage, filterArchived, filterFork, sortBy]);

  useEffect(() => {
    const stored = window.localStorage.getItem("alterssearch-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("alterssearch-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(var(--grid-dot)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
      <Topbar
        onToggleMobileNav={() => setMobileNavOpen((value) => !value)}
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      />
      <div className="content-shell mx-auto w-full max-w-[1920px] gap-5 px-0">
        <Sidebar
          recentSearches={recentSearches}
          onSelectSearch={handleInitialSearch}
          onNewSearch={resetSearch}
          isMobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          activeQuery={originalQuery}
        />

        <main className="main-area min-w-0">
          <div
            className={`main-inner px-6 py-10 md:px-8 ${
              viewState === "results"
                ? "mx-0 w-full max-w-none px-0 md:px-0"
                : "mx-auto max-w-[780px]"
            }`}
          >
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
                  <div className="mb-1">
                    <h1 className="m-0 text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
                    <p className="m-0 mt-2 text-sm text-[var(--text-secondary)]">
                      Explore high-signal repositories with refined ranking and filters.
                    </p>
                  </div>
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
                        <>
                          <FiltersPanel
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            filterDomain={filterDomain}
                            setFilterDomain={setFilterDomain}
                            filterLanguage={filterLanguage}
                            setFilterLanguage={setFilterLanguage}
                            filterArchived={filterArchived}
                            setFilterArchived={setFilterArchived}
                            filterFork={filterFork}
                            setFilterFork={setFilterFork}
                            clientSearch={clientSearch}
                            setClientSearch={setClientSearch}
                            uniqueDomains={uniqueDomains}
                            uniqueLanguages={uniqueLanguages}
                          />

                          {filteredResults.length === 0 ? (
                            <div className="empty-results">
                              <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" style={{ color: "var(--text-muted)" }}>
                                <path d="M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <h3>No repositories found</h3>
                              <p>Try adjusting filters or search terms</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {filteredResults.map((result, index) => (
                                <ResultCard key={`${result.url}-${index}`} result={result} index={index} />
                              ))}
                            </div>
                          )}
                        </>
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
