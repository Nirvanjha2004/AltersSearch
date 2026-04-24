import type { SearchResult } from "../types";
import { motion } from "framer-motion";

type ResultCardProps = {
	result: SearchResult;
	index: number;
};

export default function ResultCard({ result, index }: ResultCardProps) {
	const domainColorMap: Record<string, string> = {
		ai: "#7c3aed",
		frontend: "#3b82f6",
		backend: "#22c55e",
		devops: "#f59e0b",
		data: "#14b8a6",
		mobile: "#ec4899",
		all: "#6b7280",
	};

	const languageColors: Record<string, string> = {
		TypeScript: "#3178c6",
		JavaScript: "#f1e05a",
		Python: "#3572A5",
		Go: "#00ADD8",
		Rust: "#dea584",
		Java: "#b07219",
		C: "#555555",
		"C++": "#f34b7d",
		Shell: "#89e051",
		HTML: "#e34c26",
		CSS: "#563d7c",
	};

	const normalizedDomain = (result.domain || "all").toLowerCase();
	const domainColor = domainColorMap[normalizedDomain] || domainColorMap.all;
	const fullName = result.full_name || result.repo_name;
	const ownerLogin = result.owner_login || fullName.split("/")[0] || "unknown";
	const visibility = result.visibility || "public";
	const topics = Array.isArray(result.topics) ? result.topics : [];
	const visibleTopics = topics.slice(0, 4);
	const extraTopics = topics.length - visibleTopics.length;
	const language = result.language || "Unknown";
	const languageColor = languageColors[language] || "#6b7280";

	const formatRelativeTime = (iso?: string) => {
		if (!iso) return "pushed recently";
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "pushed recently";
		const diffMs = Date.now() - date.getTime();
		const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
		if (diffDays < 1) return "pushed today";
		if (diffDays === 1) return "pushed 1 day ago";
		if (diffDays < 30) return `pushed ${diffDays} days ago`;
		const months = Math.floor(diffDays / 30);
		if (months === 1) return "pushed 1 month ago";
		if (months < 12) return `pushed ${months} months ago`;
		const years = Math.floor(months / 12);
		return years === 1 ? "pushed 1 year ago" : `pushed ${years} years ago`;
	};

	return (
		<motion.article
			className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/65 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur transition"
			style={{ borderLeft: `3px solid ${domainColor}` }}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.24, ease: "easeOut" }}
			whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 26px rgba(76,29,149,0.22)" }}
		>
			{result.is_archived ? (
				<div className="absolute left-0 top-0 w-full bg-zinc-700/80 py-1 text-center text-[11px] uppercase tracking-[0.08em] text-zinc-200">
					Archived
				</div>
			) : null}

			<div className={`mb-3 flex items-start justify-between gap-3 ${result.is_archived ? "mt-5" : ""}`}>
				<div className="flex items-center gap-2">
					<img
						src={result.owner_avatar_url || "https://github.githubassets.com/favicons/favicon-dark.svg"}
						alt={ownerLogin}
						className="h-6 w-6 rounded-full border border-white/10"
					/>
					<span className="text-[13px] font-medium text-zinc-300">{ownerLogin}</span>
					{result.is_fork ? <span className="text-[11px] text-zinc-500">⑂ fork</span> : null}
				</div>
				<span className="shrink-0 rounded-full border border-white/10 bg-zinc-800 px-2.5 py-1 text-[11px] uppercase tracking-[0.06em] text-zinc-400">
					{visibility}
				</span>
			</div>

			<a
				href={result.url}
				target="_blank"
				rel="noreferrer"
				className="mb-2 block text-[16px] font-semibold tracking-tight text-zinc-100 no-underline transition hover:text-violet-300 hover:underline"
			>
				{fullName}
			</a>

			<p className="mb-3 line-clamp-2 min-h-[38px] text-[13px] leading-5 text-zinc-400">{result.description || "No description provided."}</p>

			{visibleTopics.length > 0 ? (
				<div className="mb-3 flex flex-wrap gap-2">
					{visibleTopics.map((topic) => (
						<span key={topic} className="rounded-full border border-white/10 bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-300">
							{topic}
						</span>
					))}
					{extraTopics > 0 ? (
						<span className="rounded-full border border-white/10 bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-400">+{extraTopics} more</span>
					) : null}
				</div>
			) : null}

			<div className="mb-3 flex items-center gap-2 text-[12px] text-zinc-300">
				<span className="h-2.5 w-2.5 rounded-full" style={{ background: languageColor }} />
				<span>{language}</span>
			</div>

			<div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-zinc-400">
				<span>⭐ {result.stargazers_count ?? 0}</span>
				<span>🍴 {result.forks_count ?? 0}</span>
				<span>⚠️ {result.open_issues_count ?? 0}</span>
			</div>

			<div className="flex items-center justify-between border-t border-white/10 pt-3 text-[12px] text-zinc-500">
				<span>{result.license_name || "No license"}</span>
				<span>{formatRelativeTime(result.github_pushed_at)}</span>
			</div>
		</motion.article>
	);
}
