"use client";

export default function SkeletonCard() {
  return (
    <div
      className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 flex flex-col gap-3 animate-pulse"
      aria-hidden="true"
    >
      {/* Repo name line */}
      <div className="h-5 w-2/5 rounded-md bg-[var(--border)]" />

      {/* Description — two lines */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-full rounded-md bg-[var(--border)]" />
        <div className="h-4 w-4/5 rounded-md bg-[var(--border)]" />
      </div>

      {/* Topic chips row */}
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-[var(--border)]" />
        <div className="h-5 w-20 rounded-full bg-[var(--border)]" />
        <div className="h-5 w-14 rounded-full bg-[var(--border)]" />
      </div>

      {/* Footer row: star + language on left, link on right */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-3">
          <div className="h-3.5 w-10 rounded-md bg-[var(--border)]" />
          <div className="h-3.5 w-16 rounded-md bg-[var(--border)]" />
        </div>
        <div className="h-3.5 w-24 rounded-md bg-[var(--border)]" />
      </div>
    </div>
  );
}
