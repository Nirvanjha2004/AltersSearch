import type { SearchResult } from "../types";

type ResultCardProps = {
	result: SearchResult;
};

export default function ResultCard({ result }: ResultCardProps) {
	return (
		<article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-zinc-700">
			<p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{result.domain}</p>
			<h3 className="mb-2 line-clamp-2 text-lg font-semibold text-zinc-100">{result.repo_name}</h3>
			<p className="mb-4 line-clamp-3 text-sm leading-6 text-zinc-300">{result.description}</p>
			<a
				href={result.url}
				target="_blank"
				rel="noreferrer"
				className="text-sm font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-4 hover:decoration-zinc-200"
			>
				Open Repository
			</a>
		</article>
	);
}
