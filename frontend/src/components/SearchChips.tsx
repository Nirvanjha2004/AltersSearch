"use client";

import { motion } from "framer-motion";
import { CHIP_GROUPS, type Chip } from "../hooks/useSearchSuggestions";
import { cn } from "../lib/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Single Chip
// ─────────────────────────────────────────────────────────────────────────────

function ChipButton({
  chip,
  index,
  onSelect,
}: {
  chip: Chip;
  index: number;
  onSelect: (query: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(chip.query)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex items-center gap-1.5",
        "h-8 px-3.5 rounded-full",
        "border border-[var(--border)] bg-[var(--bg-surface)]",
        "text-xs font-medium text-[var(--text-secondary)]",
        "cursor-pointer select-none whitespace-nowrap",
        "transition-colors duration-150",
        "hover:border-[rgba(255,120,73,0.45)] hover:text-[var(--text-primary)]",
        "hover:shadow-[0_0_10px_rgba(255,120,73,0.12)]"
      )}
    >
      {chip.emoji && (
        <span aria-hidden="true" className="text-sm leading-none">
          {chip.emoji}
        </span>
      )}
      {chip.label}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchChips
// ─────────────────────────────────────────────────────────────────────────────

interface SearchChipsProps {
  /** Called with the full query string when a chip is clicked */
  onSelect: (query: string) => void;
}

export default function SearchChips({ onSelect }: SearchChipsProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-[680px]">
      {CHIP_GROUPS.map((group, groupIndex) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 + groupIndex * 0.06 }}
        >
          {/* Group heading */}
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {group.heading}
          </p>

          {/* Chips row */}
          <div className="flex flex-wrap gap-2">
            {group.chips.map((chip, i) => (
              <ChipButton
                key={chip.id}
                chip={chip}
                index={groupIndex * 10 + i}
                onSelect={onSelect}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
