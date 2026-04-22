"use client";

import { FormEvent, useState } from "react";

type SearchBarProps = {
	onSubmit: (query: string) => Promise<void> | void;
	isLoading?: boolean;
	placeholder?: string;
	buttonLabel?: string;
};

export default function SearchBar({
	onSubmit,
	isLoading = false,
	placeholder = "Search open-source repos, tools, or patterns...",
	buttonLabel = "Search",
}: SearchBarProps) {
	const [query, setQuery] = useState("");

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = query.trim();
		if (!trimmed || isLoading) {
			return;
		}

		await onSubmit(trimmed);
	};

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
				<input
					type="text"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={placeholder}
					className="h-12 w-full rounded-xl bg-zinc-950 px-4 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:bg-zinc-900"
					aria-label="Search query"
				/>
				<button
					type="submit"
					disabled={isLoading}
					className="h-12 min-w-28 rounded-xl bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isLoading ? "Thinking..." : buttonLabel}
				</button>
			</div>
		</form>
	);
}
