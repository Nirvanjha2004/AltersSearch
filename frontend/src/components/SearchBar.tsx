"use client";

import { PlaceholderAndVanishInput } from "./ui/placeholder-vanish-input";
import { cn } from "../lib/cn";

const SEARCH_PLACEHOLDERS = [
  "python csv parser",
  "alternatives to Redis",
  "react drag and drop",
  "fast HTTP server in Go",
  "ML model serving framework",
];

interface SearchBarProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function SearchBar({
  onSubmit,
  isLoading,
  initialValue,
}: SearchBarProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-[var(--accent)]",
        "focus-within:ring-2 focus-within:ring-[var(--accent)]",
        "transition-shadow duration-200"
      )}
    >
      <PlaceholderAndVanishInput
        placeholders={SEARCH_PLACEHOLDERS}
        onSubmit={onSubmit}
        isLoading={isLoading}
        initialValue={initialValue}
      />
    </div>
  );
}
