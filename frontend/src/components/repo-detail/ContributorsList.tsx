"use client";

import { motion } from "framer-motion";
import type { RepoContributor } from "../../types";

type ContributorsListProps = {
  contributors: RepoContributor[];
};

export default function ContributorsList({ contributors }: ContributorsListProps) {
  if (!contributors.length) {
    return <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">No contributor data found.</div>;
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4">
      <div className="grid gap-2">
        {contributors.map((contributor) => (
          <a
            key={contributor.id}
            href={contributor.html_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-transparent bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-secondary)] no-underline transition hover:border-white/10 hover:shadow-[0_10px_26px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center gap-3">
              <img src={contributor.avatar_url} alt={contributor.login} className="h-8 w-8 rounded-full border border-white/10" />
              <span className="text-sm">{contributor.login}</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{contributor.contributions} commits</span>
          </a>
        ))}
      </div>
    </motion.section>
  );
}
