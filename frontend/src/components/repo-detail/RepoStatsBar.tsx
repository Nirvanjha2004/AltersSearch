"use client";

import { motion } from "framer-motion";
import { Bug, Eye, GitFork, Star } from "lucide-react";
import type { RepoDetails } from "../../types";

type RepoStatsBarProps = {
  repo: RepoDetails;
};

export default function RepoStatsBar({ repo }: RepoStatsBarProps) {
  const items = [
    { label: "Stars", value: repo.stargazers_count, icon: Star },
    { label: "Forks", value: repo.forks_count, icon: GitFork },
    { label: "Issues", value: repo.open_issues_count, icon: Bug },
    { label: "Watchers", value: repo.subscribers_count || repo.watchers_count, icon: Eye },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: "easeOut", delay: 0.03 }} className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-xl border border-white/10 bg-[var(--bg-surface)] p-4">
          <p className="m-0 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <item.icon size={13} />
            {item.label}
          </p>
          <p className="m-0 mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{item.value.toLocaleString()}</p>
        </article>
      ))}
    </motion.section>
  );
}
