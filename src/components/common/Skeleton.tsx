import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading component
 * Hiển thị placeholder với animation shimmer
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}
