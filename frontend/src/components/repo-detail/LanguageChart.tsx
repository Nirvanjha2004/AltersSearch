"use client";

import { motion } from "framer-motion";

type LanguageChartProps = {
  languages: Record<string, number>;
};

export default function LanguageChart({ languages }: LanguageChartProps) {
  const rows = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);

  if (!rows.length || total === 0) {
    return <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">No language stats available.</div>;
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6">
      <h3 className="m-0 text-base font-semibold text-[var(--text-primary)]">Language Breakdown</h3>
      <div className="mt-4 grid gap-3">
        {rows.map(([name, value]) => {
          const percent = Math.round((value / total) * 100);
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{name}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-2 rounded-full bg-[var(--accent)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
