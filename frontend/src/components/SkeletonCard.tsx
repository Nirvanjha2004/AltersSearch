"use client";

export default function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line h-4 w-2/5" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="skeleton-line h-3 w-full" />
        <div className="skeleton-line h-3 w-4/5" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton-line h-5 w-14 rounded-full" />
        <div className="skeleton-line h-5 w-18 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <div className="flex gap-3">
          <div className="skeleton-line h-3 w-8" />
          <div className="skeleton-line h-3 w-14" />
        </div>
        <div className="skeleton-line h-3 w-12" />
      </div>
    </div>
  );
}
