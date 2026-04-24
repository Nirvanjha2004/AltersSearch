"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Archive, ArrowUpDown, ChevronDown, GitFork, Layers3, Languages, Search, SlidersHorizontal } from "lucide-react";

type SortBy = "stars" | "forks" | "pushed" | "created";
type BinaryFilter = "all" | "yes" | "no";

type FiltersPanelProps = {
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  filterDomain: string;
  setFilterDomain: (value: string) => void;
  filterLanguage: string;
  setFilterLanguage: (value: string) => void;
  filterArchived: BinaryFilter;
  setFilterArchived: (value: BinaryFilter) => void;
  filterFork: BinaryFilter;
  setFilterFork: (value: BinaryFilter) => void;
  clientSearch: string;
  setClientSearch: (value: string) => void;
  uniqueDomains: string[];
  uniqueLanguages: string[];
};

function SelectField({
  label,
  icon,
  value,
  onChange,
  children,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--text-primary)_18%,transparent)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      >
        {children}
      </select>
    </label>
  );
}

export default function FiltersPanel({
  sortBy,
  setSortBy,
  filterDomain,
  setFilterDomain,
  filterLanguage,
  setFilterLanguage,
  filterArchived,
  setFilterArchived,
  filterFork,
  setFilterFork,
  clientSearch,
  setClientSearch,
  uniqueDomains,
  uniqueLanguages,
}: FiltersPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (filterDomain !== "all") count += 1;
    if (filterLanguage !== "all") count += 1;
    if (filterArchived !== "all") count += 1;
    if (filterFork !== "all") count += 1;
    return count;
  }, [filterArchived, filterDomain, filterFork, filterLanguage]);

  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-subtle)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label="Repository filters"
    >
      <div className="relative mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
        <SlidersHorizontal size={11} />
        Refine Results
      </div>

      <div className="relative grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
            <Search size={13} />
            Search in results
          </span>
          <input
            value={clientSearch}
            onChange={(event) => setClientSearch(event.target.value)}
            placeholder="repo name or description"
            className="h-10 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition duration-200 ease-out placeholder:text-[var(--text-muted)] hover:border-[color:color-mix(in_srgb,var(--text-primary)_18%,transparent)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        <SelectField label="Sort by" icon={<ArrowUpDown size={13} />} value={sortBy} onChange={(value) => setSortBy(value as SortBy)}>
          <option value="stars">Stars</option>
          <option value="forks">Forks</option>
          <option value="pushed">Recently Pushed</option>
          <option value="created">Recently Created</option>
        </SelectField>

        <div className="flex items-end">
          <motion.button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            onClick={() => setShowAdvanced((value) => !value)}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeAdvancedCount > 0 ? (
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
                {activeAdvancedCount}
              </span>
            ) : null}
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </motion.button>
        </div>
      </div>

      {showAdvanced ? (
        <motion.div
          className="relative mt-4 grid grid-cols-1 gap-3 border-t border-[var(--bg-border)] pt-4 md:grid-cols-2 xl:grid-cols-4"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <SelectField label="Domain" icon={<Layers3 size={13} />} value={filterDomain} onChange={setFilterDomain}>
            {uniqueDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </SelectField>

          <SelectField label="Language" icon={<Languages size={13} />} value={filterLanguage} onChange={setFilterLanguage}>
            {uniqueLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </SelectField>

          <SelectField label="Archived" icon={<Archive size={13} />} value={filterArchived} onChange={(value) => setFilterArchived(value as BinaryFilter)}>
            <option value="all">All</option>
            <option value="yes">Archived only</option>
            <option value="no">Exclude archived</option>
          </SelectField>

          <SelectField label="Forked" icon={<GitFork size={13} />} value={filterFork} onChange={(value) => setFilterFork(value as BinaryFilter)}>
            <option value="all">All</option>
            <option value="yes">Forks only</option>
            <option value="no">Exclude forks</option>
          </SelectField>
        </motion.div>
      ) : null}
    </motion.section>
  );
}
