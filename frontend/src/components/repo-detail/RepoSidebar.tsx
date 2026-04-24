"use client";

import { motion } from "framer-motion";
import type { RepoDetails } from "../../types";

type RepoSidebarProps = {
  repo: RepoDetails;
  languages: Record<string, number>;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function RepoSidebar({ repo, languages }: RepoSidebarProps) {
  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const total = topLanguages.reduce((sum, [, bytes]) => sum + bytes, 0);

  const items = [
    { label: "Last Updated", value: formatDate(repo.updated_at) },
    { label: "License", value: repo.license?.name || "No license" },
    { label: "Default Branch", value: repo.default_branch || "main" },
  ];

  return (
    <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut", delay: 0.04 }} className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4">
        <h3 className="m-0 text-sm font-semibold text-[var(--text-primary)]">Languages</h3>
        <div className="mt-3 space-y-2">
          {topLanguages.length ? (
            topLanguages.map(([name, bytes]) => {
              const pct = Math.round((bytes / total) * 100);
              return (
                <div key={name} className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  <div className="mb-1 flex items-center justify-between">
                    <span>{name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/20">
                    <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="m-0 text-xs text-[var(--text-muted)]">No language data available.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4">
        <h3 className="m-0 text-sm font-semibold text-[var(--text-primary)]">Repository Info</h3>
        <dl className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{item.label}</dt>
              <dd className="m-0 mt-1 text-sm text-[var(--text-secondary)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </motion.aside>
  );
}
