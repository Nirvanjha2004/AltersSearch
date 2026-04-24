type SkeletonCardProps = {
  index: number;
};

export default function SkeletonCard({ index }: SkeletonCardProps) {
  return <div className="skeleton-card" style={{ animationDelay: `${index * 90}ms` }} aria-hidden="true" />;
}
