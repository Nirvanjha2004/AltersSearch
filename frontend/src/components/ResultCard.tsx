import type { SearchResult } from "../types";
import { motion } from "framer-motion";

type ResultCardProps = {
	result: SearchResult;
	index: number;
};

export default function ResultCard({ result, index }: ResultCardProps) {
	return (
		<motion.article
			className="rounded-2xl border border-white/10 bg-zinc-900/65 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur transition"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.24, ease: "easeOut" }}
			whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 26px rgba(76,29,149,0.22)" }}
		>
			<div className="mb-2 flex items-center justify-between gap-3">
				<h3 className="truncate text-[15px] font-semibold text-zinc-100">{result.repo_name}</h3>
				<span className="shrink-0 rounded-full border border-white/10 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">{result.domain}</span>
			</div>
			<p className="mb-4 line-clamp-2 text-[13px] leading-6 text-zinc-400">{result.description}</p>
			<a href={result.url} target="_blank" rel="noreferrer" className="text-[12px] text-violet-300 no-underline transition hover:underline">
				{result.url}
			</a>
		</motion.article>
	);
}
