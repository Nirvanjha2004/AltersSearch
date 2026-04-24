"use client";

import { motion } from "framer-motion";

export type RepoTabId = "overview" | "readme" | "contributors" | "languages";

type RepoTabsProps = {
  activeTab: RepoTabId;
  onTabChange: (tab: RepoTabId) => void;
};

const TABS: { id: RepoTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "readme", label: "README" },
  { id: "contributors", label: "Contributors" },
  { id: "languages", label: "Languages" },
];

export default function RepoTabs({ activeTab, onTabChange }: RepoTabsProps) {
  return (
    <div className="relative flex w-full gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[var(--bg-surface)] p-2">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative rounded-lg px-4 py-2 text-sm transition ${
              isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="repo-active-tab"
                className="absolute inset-0 rounded-lg border border-white/10 bg-[var(--bg-elevated)]"
                transition={{ type: "spring", duration: 0.25 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
