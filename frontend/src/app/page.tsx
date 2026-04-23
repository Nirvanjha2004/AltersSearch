"use client";

import { useMemo, useState } from "react";
import ClarificationPrompt from "../components/ClarificationPrompt";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import type { AgentResponse, SearchRequest, SearchResult } from "../types";

type ViewState = "search" | "clarification" | "results";

export default function HomePage() {
    const [viewState, setViewState] = useState<ViewState>("search");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [originalQuery, setOriginalQuery] = useState("");
    const [clarificationQuestion, setClarificationQuestion] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);

    // Dynamic Title Logic
    const title = useMemo(() => {
        if (viewState === "clarification") return "Need one more detail";
        if (viewState === "results") return "Search results";
        return "Open Source Search";
    }, [viewState]);

    // API Caller Utility
    const callSearchApi = async (payload: SearchRequest): Promise<AgentResponse> => {
        const response = await fetch("http://localhost:8000/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Search API failed with status ${response.status}`);
        }

        return (await response.json()) as AgentResponse;
    };

    // Handler 1: Initial user search
    const handleInitialSearch = async (query: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        setOriginalQuery(query); // Store the first intent

        try {
            const data = await callSearchApi({ query });

            // SYNCED: Matches backend "clarification_needed" status
            if (data.status === "clarification_needed") {
                setClarificationQuestion(data.message || "Could you clarify your search?");
                setViewState("clarification");
                setResults([]);
                return;
            }

            setResults(data.results ?? []);
            setViewState("results");
        } catch (err) {
            setErrorMessage("Could not reach the backend. Ensure FastAPI is running on port 8000.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handler 2: Submitting the clarification answer
    const handleClarificationSubmit = async (answer: string) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            // THE CONTEXT LOOP: We combine the original query with the new answer
            // This ensures the LLM 'remembers' the unsiloed ai part.
            const combinedQuery = `Original intent: ${originalQuery}. Clarification: ${answer}`;
            
            const data = await callSearchApi({ query: combinedQuery });

            if (data.status === "clarification_needed") {
                // If the LLM is still confused, we stay in this state with the new question
                setClarificationQuestion(data.message || "I still need a bit more detail.");
                return;
            }

            setResults(data.results ?? []);
            setViewState("results");
        } catch (err) {
            setErrorMessage("Unable to submit clarification. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(63,63,70,0.2),transparent_55%),linear-gradient(180deg,#09090b_0%,#0a0a0a_100%)] text-zinc-100">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 sm:px-10">
                
                <header className="mb-10">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">AltersSearch</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl transition-all duration-500">{title}</h1>
                </header>

                {errorMessage && (
                    <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200 animate-in fade-in zoom-in duration-300">
                        {errorMessage}
                    </div>
                )}

                {/* Initial Search View */}
                {viewState === "search" && (
                    <section className="flex flex-1 items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="w-full max-w-3xl">
                            <SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} />
                        </div>
                    </section>
                )}

                {/* Clarification Interception View */}
                {viewState === "clarification" && (
                    <section className="mx-auto w-full max-w-2xl pt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <ClarificationPrompt
                            question={clarificationQuestion}
                            onSubmit={handleClarificationSubmit}
                            isLoading={isLoading}
                        />
                        <button 
                            onClick={() => setViewState("search")}
                            className="mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            ← Back to initial search
                        </button>
                    </section>
                )}

                {/* Results View */}
                {viewState === "results" && (
                    <section className="space-y-8 animate-in fade-in duration-500">
                        <div className="w-full max-w-3xl">
                            <SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} buttonLabel="Search" />
                        </div>

                        {results.length === 0 ? (
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-20 text-center text-zinc-400">
                                <p>No repositories found. Try refining your search query.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {results.map((result: SearchResult) => (
                                    <ResultCard key={result.url} result={result} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}