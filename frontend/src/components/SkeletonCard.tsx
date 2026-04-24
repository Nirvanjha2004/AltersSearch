type SkeletonCardProps = {
  index: number;
};

export default function SkeletonCard({ index }: SkeletonCardProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
      style={{ animationDelay: `${index * 90}ms` }}
      aria-hidden="true"
    >
      <div className="skeleton-card mb-3 h-5 w-32 rounded-md" />
      <div className="skeleton-card mb-2 h-6 w-4/5 rounded-md" />
      <div className="skeleton-card mb-4 h-10 w-full rounded-md" />
      <div className="skeleton-card mb-3 h-5 w-2/3 rounded-md" />
      <div className="skeleton-card h-4 w-full rounded-md" />
    </div>
  );
}
