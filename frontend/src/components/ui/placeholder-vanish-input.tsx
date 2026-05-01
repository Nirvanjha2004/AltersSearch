"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

interface PlaceholderAndVanishInputProps {
  placeholders: string[];
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  initialValue?: string;
}

export function PlaceholderAndVanishInput({
  placeholders,
  onSubmit,
  isLoading = false,
  initialValue = "",
}: PlaceholderAndVanishInputProps) {
  const [value, setValue] = useState(initialValue);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [animating, setAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle placeholders
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [placeholders.length]);

  // Sync initialValue
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    setAnimating(true);
    setTimeout(() => {
      onSubmit(value.trim());
      setValue("");
      setAnimating(false);
    }, 300);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full items-center"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholders[currentPlaceholder]}
        disabled={isLoading}
        className={cn(
          "w-full bg-transparent py-3 pl-4 pr-12 text-sm text-[var(--text-primary)] outline-none",
          "placeholder:text-[var(--text-muted)] placeholder:transition-all placeholder:duration-500",
          animating && "opacity-0 transition-opacity duration-300",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        aria-label="Submit search"
        className={cn(
          "absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-all",
          "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </form>
  );
}
