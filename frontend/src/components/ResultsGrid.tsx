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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {isLoading ? (
        // Loading state: render skeleton placeholders
        Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))
      ) : results.length === 0 ? (
        // Empty state: no results found
        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-2 text-center">
          <p className="text-[var(--text-primary)] text-lg font-semibold">
            No repositories found
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            Try a different query or search the web
          </p>
        </div>
      ) : (
        // Results state: animate cards in with AnimatePresence
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div
              key={result.full_name ?? result.repo_name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <RepoCard result={result} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
