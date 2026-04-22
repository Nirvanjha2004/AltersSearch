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

	const title = useMemo(() => {
		if (viewState === "clarification") return "Need one more detail";
		if (viewState === "results") return "Search results";
		return "Open Source Search";
	}, [viewState]);

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

	const handleInitialSearch = async (query: string) => {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const data = await callSearchApi({ query });
			setOriginalQuery(query);

			if (data.status === "needs_clarification") {
				setClarificationQuestion(
					data.clarification_question ?? "Could you provide a bit more detail for your search?"
				);
				setViewState("clarification");
				setResults([]);
				return;
			}

			setResults(data.results ?? []);
			setViewState("results");
		} catch {
			setErrorMessage("Could not reach the backend. Check that the API is running on localhost:8000.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClarificationSubmit = async (answer: string) => {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const data = await callSearchApi({
				query: originalQuery,
				context: answer,
			});

			if (data.status === "needs_clarification") {
				setClarificationQuestion(
					data.clarification_question ?? "Could you be more specific so I can search correctly?"
				);
				setViewState("clarification");
				setResults([]);
				return;
			}

			setResults(data.results ?? []);
			setViewState("results");
		} catch {
			setErrorMessage("Unable to submit clarification. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(63,63,70,0.2),transparent_55%),linear-gradient(180deg,#09090b_0%,#0a0a0a_100%)] text-zinc-100">
			<div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 sm:px-10">
				<header className="mb-10">
					<p className="text-xs uppercase tracking-[0.25em] text-zinc-500">AltersSearch</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
				</header>

				{errorMessage ? (
					<div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
						{errorMessage}
					</div>
				) : null}

				{viewState === "search" ? (
					<section className="flex flex-1 items-center justify-center">
						<div className="w-full max-w-3xl">
							<SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} />
						</div>
					</section>
				) : null}

				{viewState === "clarification" ? (
					<section className="mx-auto w-full max-w-2xl">
						<ClarificationPrompt
							question={clarificationQuestion}
							onSubmit={handleClarificationSubmit}
							isLoading={isLoading}
						/>
					</section>
				) : null}

				{viewState === "results" ? (
					<section className="space-y-6">
						<div className="w-full max-w-3xl">
							<SearchBar onSubmit={handleInitialSearch} isLoading={isLoading} buttonLabel="Run New Search" />
						</div>

						{results.length === 0 ? (
							<div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-10 text-center text-zinc-300">
								No results yet. The backend is currently returning a mocked empty list.
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{results.map((result: SearchResult) => (
									<ResultCard key={result.url} result={result} />
								))}
							</div>
						)}
					</section>
				) : null}
			</div>
		</main>
	);
}
