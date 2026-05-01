import { cn } from "../lib/cn";

interface SuggestionChipsProps {
  onSelect: (chip: string) => void;
}

const CHIPS = [
  "python csv parser",
  "alternatives to Redis",
  "react drag and drop",
] as const;

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-row flex-wrap gap-2 justify-center">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className={cn(
            "bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-4 py-1.5 text-sm text-[var(--text-muted)]",
            "hover:border-[var(--accent)] hover:text-[var(--text-primary)]",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
