"use client";

import { FormEvent, useState } from "react";

type ClarificationPromptProps = {
	question: string;
	onSubmit: (answer: string) => Promise<void> | void;
	isLoading?: boolean;
};

export default function ClarificationPrompt({
	question,
	onSubmit,
	isLoading = false,
}: ClarificationPromptProps) {
	const [answer, setAnswer] = useState("");

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = answer.trim();
		if (!trimmed || isLoading) {
			return;
		}

		await onSubmit(trimmed);
	};

	return (
		<div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_0_40px_-20px_rgba(255,255,255,0.2)]">
			<p className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-500">Need Clarification</p>
			<p className="mb-6 text-lg font-medium text-zinc-100">{question}</p>

			<form onSubmit={handleSubmit} className="space-y-3">
				<input
					type="text"
					value={answer}
					onChange={(event) => setAnswer(event.target.value)}
					placeholder="Add details so we can run a better search..."
					className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
					aria-label="Clarification answer"
				/>
				<button
					type="submit"
					disabled={isLoading}
					className="h-11 rounded-xl bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isLoading ? "Submitting..." : "Submit Clarification"}
				</button>
			</form>
		</div>
	);
}
