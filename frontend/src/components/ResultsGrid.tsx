"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RepoCard } from "./RepoCard";
import SkeletonCard from "./SkeletonCard";
import type { SearchResult } from "../types";

interface ResultsGridProps {
  results: SearchResult[];
  isLoading: boolean;
}

const SKELETON_COUNT = 6;

export function ResultsGrid({ results, isLoading }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="results-grid">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <p className="text-[var(--text-primary)] text-base font-medium">
          No repositories found
        </p>
        <p className="text-[var(--text-muted)] text-sm">
          Try a different query or be more specific
        </p>
      </div>
    );
  }

  return (
    <div className="results-grid">
      <AnimatePresence>
        {results.map((result, i) => (
          <motion.div
            key={result.full_name ?? result.repo_name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <RepoCard result={result} index={i} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
