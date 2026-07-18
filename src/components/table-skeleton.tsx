import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: Props) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
