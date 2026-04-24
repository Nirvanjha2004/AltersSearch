import type { SearchResult } from "../types";
import { motion } from "framer-motion";
import { AlertCircle, Archive, Eye, GitFork, Lock, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResultCardProps = {
	result: SearchResult;
	index: number;
};

export default function ResultCard({ result, index }: ResultCardProps) {
	const router = useRouter();
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

	const fullName = result.full_name || result.repo_name;
	const [owner = "", repo = ""] = fullName.split("/");
	const detailsHref = owner && repo ? `/repo/${owner}/${repo}` : result.url;
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
			className="group relative overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-subtle)] backdrop-blur transition duration-200 ease-out"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.24, ease: "easeOut" }}
			whileHover={{ scale: 1.02, y: -2, boxShadow: "0 14px 34px rgba(15, 23, 42, 0.36)" }}
			onClick={() => router.push(detailsHref)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					router.push(detailsHref);
				}
			}}
			role="button"
			tabIndex={0}
		>
			<div className="pointer-events-none absolute inset-0 rounded-2xl p-[1px] opacity-0 transition duration-200 group-hover:opacity-100">
				<div className="h-full w-full rounded-2xl bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_62%,transparent),transparent_35%,transparent)]" />
			</div>
			<div className="pointer-events-none absolute inset-[1px] rounded-2xl bg-[color:color-mix(in_srgb,var(--bg-surface)_90%,transparent)]" />

			{result.is_archived ? (
				<div className="absolute left-0 top-0 z-10 w-full bg-amber-500/18 py-1 text-center text-[11px] uppercase tracking-[0.08em] text-amber-200">
					Archived
				</div>
			) : null}

			<div className={`relative z-10 mb-3 flex items-start justify-between gap-3 ${result.is_archived ? "mt-5" : ""}`}>
				<div className="flex items-center gap-2">
					<img
						src={result.owner_avatar_url || "https://github.githubassets.com/favicons/favicon-dark.svg"}
						alt={ownerLogin}
						className="h-6 w-6 rounded-full border border-[var(--bg-border)]"
					/>
					<span className="text-[13px] font-medium text-[var(--text-secondary)]">{ownerLogin}</span>
					{result.is_fork ? <span className="text-[11px] text-[var(--text-muted)]">⑂ fork</span> : null}
				</div>
				<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
					{visibility === "private" ? <Lock size={11} /> : <Eye size={11} />}
					{visibility}
				</span>
			</div>

			<Link
				href={owner && repo ? `/repo/${owner}/${repo}` : result.url}
				onClick={(event) => event.stopPropagation()}
				className="relative z-10 mb-2 block text-[16px] font-semibold tracking-tight text-[var(--text-primary)] no-underline transition hover:text-[var(--accent)] hover:underline"
			>
				{fullName}
			</Link>

			<p className="relative z-10 mb-4 line-clamp-2 min-h-[44px] text-[13px] leading-6 text-[var(--text-secondary)]">{result.description || "No description provided."}</p>

			{visibleTopics.length > 0 ? (
				<div className="relative z-10 mb-3 flex flex-wrap gap-2">
					{visibleTopics.map((topic) => (
						<span key={topic} className="rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
							{topic}
						</span>
					))}
					{extraTopics > 0 ? (
						<span className="rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">+{extraTopics} more</span>
					) : null}
				</div>
			) : null}

			<div className="relative z-10 mb-4 flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
				<span className="h-2.5 w-2.5 rounded-full" style={{ background: languageColor }} />
				<span>{language}</span>
			</div>

			<div className="relative z-10 mb-4 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
				<span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-secondary)]">
					<Star size={12} />
					{result.stargazers_count ?? 0}
				</span>
				<span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-secondary)]">
					<GitFork size={12} />
					{result.forks_count ?? 0}
				</span>
				<span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-secondary)]">
					<AlertCircle size={12} />
					{result.open_issues_count ?? 0}
				</span>
			</div>

			<div className="relative z-10 flex items-center justify-between border-t border-[var(--bg-border)] pt-3 text-[12px] text-[var(--text-muted)]">
				<span>{result.license_name || "No license"}</span>
				<span className="inline-flex items-center gap-1">
					{result.is_archived ? <Archive size={12} className="text-amber-300" /> : null}
					{formatRelativeTime(result.github_pushed_at)}
				</span>
			</div>
		</motion.article>
	);
}
