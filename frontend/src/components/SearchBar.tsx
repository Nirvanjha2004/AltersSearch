"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Send } from "lucide-react";

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
			<div className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[color:color-mix(in_srgb,var(--bg-surface)_88%,transparent)] px-5 py-4 shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-all duration-200 ease-out focus-within:border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft),var(--shadow-elevated)]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_180px_at_50%_-60%,rgba(139,92,246,0.14),transparent_60%)]" />
				<div className="mb-4 flex items-start gap-3">
					<span className="mt-0.5 text-[var(--text-secondary)] transition-colors duration-200 group-focus-within:text-[var(--accent)]" aria-hidden="true">
						<Search size={17} />
					</span>
					<textarea
						ref={textareaRef}
						className="relative z-10 max-h-[152px] min-h-[24px] w-full resize-none bg-transparent text-[16px] leading-7 tracking-[-0.01em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						placeholder="Search for a repo, library, or ask anything..."
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={onKeyDown}
						rows={1}
						autoFocus={autoFocus}
						aria-label="Search query"
					/>
				</div>

				<div className="flex items-center justify-between border-t border-white/10 pt-3">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
						<Sparkles size={12} />
						{modeLabel}
					</span>
					<motion.button
						type="submit"
						disabled={isLoading || !query.trim()}
						className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[linear-gradient(145deg,var(--accent),var(--accent-hover))] text-base text-white shadow-[0_8px_20px_rgba(139,92,246,0.35)] transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40"
						whileHover={isLoading || !query.trim() ? undefined : { scale: 1.03, filter: "brightness(1.08)" }}
						whileTap={isLoading || !query.trim() ? undefined : { scale: 0.97 }}
					>
						{isLoading ? <span className="spinner" aria-hidden="true" /> : <Send size={16} />}
					</motion.button>
				</div>
			</div>
		</motion.form>
	);
}
