"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type RouteMode = "vector_search" | "web_search" | "clarify";

type SearchBarProps = {
	onSubmit: (query: string) => Promise<void> | void;
	isLoading?: boolean;
	initialValue?: string;
	routeMode?: RouteMode;
	autoFocus?: boolean;
};

export default function SearchBar({
	onSubmit,
	isLoading = false,
	initialValue = "",
	routeMode = "vector_search",
	autoFocus = false,
}: SearchBarProps) {
	const [query, setQuery] = useState(initialValue);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		setQuery(initialValue);
	}, [initialValue]);

	useEffect(() => {
		if (!textareaRef.current) {
			return;
		}
		const el = textareaRef.current;
		el.style.height = "auto";
		const nextHeight = Math.min(el.scrollHeight, 152);
		el.style.height = `${nextHeight}px`;
	}, [query]);

	const handleSubmit = async (event?: FormEvent) => {
		event?.preventDefault();
		const trimmed = query.trim();
		if (!trimmed || isLoading) {
			return;
		}
		await onSubmit(trimmed);
	};

	const onKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			await handleSubmit();
		}
	};

	const modeLabel =
		routeMode === "web_search"
			? "Web Search"
			: routeMode === "clarify"
				? "Clarification"
				: "Vector Search";

	return (
		<form className="search-shell" onSubmit={handleSubmit}>
			<div className="search-input-wrap">
				<textarea
					ref={textareaRef}
					className="search-textarea"
					placeholder="Search for a repo, library, or ask anything..."
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={onKeyDown}
					rows={1}
					autoFocus={autoFocus}
					aria-label="Search query"
				/>
				<div className="search-bottom-row">
					<span className="mode-pill">{modeLabel}</span>
					<button className="send-btn" type="submit" disabled={isLoading || !query.trim()}>
						{isLoading ? <span className="spinner" aria-hidden="true" /> : "↑"}
					</button>
				</div>
			</div>
		</form>
	);
}
