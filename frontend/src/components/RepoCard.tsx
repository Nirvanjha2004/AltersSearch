"use client";

import React from "react";
import { motion } from "framer-motion";
import { BackgroundGradient } from "./ui/background-gradient";
import { cn } from "../lib/cn";
import type { SearchResult } from "../types";

// Conventional language colors
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

interface RepoCardProps {
  result: SearchResult;
  index: number;
}

export function RepoCard({ result, index }: RepoCardProps) {
  const {
    repo_name,
    description,
    url,
    topics = [],
    language,
    stargazers_count,
  } = result;

  const githubUrl = url || "#";
  const langColor = language ? (LANG_COLORS[language] ?? "#6b7280") : null;
  const visibleTopics = topics.slice(0, 4);

  function formatStars(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return String(count);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ scale: 1.02, y: -4 }}
      // spring transition only applies to whileHover; the animate transition above
      // uses the default (duration-based). We override per-gesture via style prop.
    >
      <BackgroundGradient>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex flex-col gap-3 rounded-xl bg-[var(--card-bg)] p-5 h-full",
            "cursor-pointer outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          )}
        >
          {/* Repo name */}
          <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug truncate">
            {repo_name}
          </h3>

          {/* Description */}
          <p className="text-[var(--text-muted)] text-sm line-clamp-2 flex-1">
            {description || "No description available."}
          </p>

          {/* Topic chips */}
          {visibleTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-1">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              {/* Star count */}
              {stargazers_count !== undefined && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">★</span>
                  <span>{formatStars(stargazers_count)}</span>
                </span>
              )}

              {/* Language dot */}
              {language && langColor && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: langColor }}
                    aria-hidden="true"
                  />
                  <span>{language}</span>
                </span>
              )}
            </div>

            {/* GitHub link */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "text-xs text-[var(--accent)] hover:text-[var(--glow-accent)] transition-colors whitespace-nowrap",
                "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none rounded"
              )}
              aria-label={`View ${repo_name} on GitHub`}
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </BackgroundGradient>
    </motion.div>
  );
}
