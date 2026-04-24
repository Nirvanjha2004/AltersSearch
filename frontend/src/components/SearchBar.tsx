"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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
		<motion.form
			onSubmit={handleSubmit}
			className="w-full"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.24, ease: "easeOut" }}
		>
			<div className="group w-full rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 focus-within:border-violet-500/60 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.14),0_14px_40px_rgba(0,0,0,0.6)]">
				<div className="mb-3 flex items-start gap-3">
					<span className="mt-0.5 text-zinc-500" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="18" height="18">
							<path d="m15.5 15.5 4 4M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
						</svg>
					</span>
					<textarea
						ref={textareaRef}
						className="max-h-[152px] min-h-[24px] w-full resize-none bg-transparent text-[16px] leading-7 tracking-[-0.01em] text-zinc-100 outline-none placeholder:text-zinc-500"
						placeholder="Search for a repo, library, or ask anything..."
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={onKeyDown}
						rows={1}
						autoFocus={autoFocus}
						aria-label="Search query"
					/>
				</div>

				<div className="flex items-center justify-between">
					<span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-violet-300">
						{modeLabel}
					</span>
					<motion.button
						type="submit"
						disabled={isLoading || !query.trim()}
						className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-base text-white shadow-[0_6px_18px_rgba(109,40,217,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40"
						whileHover={isLoading || !query.trim() ? undefined : { scale: 1.03, filter: "brightness(1.08)" }}
						whileTap={isLoading || !query.trim() ? undefined : { scale: 0.97 }}
					>
						{isLoading ? <span className="spinner" aria-hidden="true" /> : "↑"}
					</motion.button>
				</div>
			</div>
		</motion.form>
	);
}
