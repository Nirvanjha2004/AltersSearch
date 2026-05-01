"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import type { SearchResult } from "../types";

const LANG_COLORS: Record<string, string> = {
  TypeScript:  "#3178c6",
  JavaScript:  "#f1e05a",
  Python:      "#3572A5",
  Rust:        "#dea584",
  Go:          "#00ADD8",
  Java:        "#b07219",
  "C++":       "#f34b7d",
  Ruby:        "#701516",
  Swift:       "#F05138",
  Kotlin:      "#A97BFF",
};

interface RepoCardProps {
  result: SearchResult;
  index: number;
}

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
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
  const langColor = language ? (LANG_COLORS[language] ?? "#606060") : null;
  const visibleTopics = topics.slice(0, 3);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn("repo-card", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]")}
        onClick={() => window.open(githubUrl, "_blank", "noopener,noreferrer")}
      >
        {/* Name */}
        <h3 className="repo-name">{repo_name}</h3>

        {/* Description */}
        <p className="repo-desc">
          {description || "No description available."}
        </p>

        {/* Topics */}
        {visibleTopics.length > 0 && (
          <div className="repo-topics">
            {visibleTopics.map((topic) => (
              <span key={topic} className="repo-topic">
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="repo-footer">
          <div className="repo-meta">
            {stargazers_count !== undefined && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="text-[var(--accent)]">★</span>
                {formatStars(stargazers_count)}
              </span>
            )}
            {language && langColor && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: langColor }}
                  aria-hidden="true"
                />
                {language}
              </span>
            )}
          </div>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="repo-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            aria-label={`View ${repo_name} on GitHub`}
          >
            View →
          </a>
        </div>
      </div>
    </motion.div>
  );
}
