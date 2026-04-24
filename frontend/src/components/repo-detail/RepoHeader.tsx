"use client";

import { motion } from "framer-motion";
import { Copy, ExternalLink, Star } from "lucide-react";
import type { RepoDetails } from "../../types";

type RepoHeaderProps = {
  repo: RepoDetails;
};

export default function RepoHeader({ repo }: RepoHeaderProps) {
  const copyRepoUrl = async () => {
    await navigator.clipboard.writeText(repo.html_url);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6"
    >
      <p className="m-0 text-sm text-[var(--text-secondary)]">Repository</p>
      <h1 className="m-0 mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{repo.full_name}</h1>

      <div className="mt-4 flex items-center gap-3">
        <img src={repo.owner.avatar_url} alt={repo.owner.login} className="h-8 w-8 rounded-full border border-white/10" />
        <a href={repo.owner.html_url} target="_blank" rel="noreferrer" className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
          {repo.owner.login}
        </a>
      </div>

      {repo.description ? <p className="mt-4 mb-0 text-sm leading-6 text-[var(--text-secondary)]">{repo.description}</p> : null}

      {repo.topics?.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {repo.topics.slice(0, 8).map((topic) => (
            <span key={topic} className="rounded-full border border-white/10 bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <motion.a
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[linear-gradient(120deg,var(--accent),var(--accent-hover))] px-4 py-2 text-sm font-medium text-white no-underline"
        >
          <ExternalLink size={14} />
          Visit GitHub
        </motion.a>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Star size={14} />
          Star
        </motion.button>
        <motion.button onClick={copyRepoUrl} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Copy size={14} />
          Copy URL
        </motion.button>
      </div>
    </motion.section>
  );
}
