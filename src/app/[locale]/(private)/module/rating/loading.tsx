import { TableSkeleton } from '@/components/table-skeleton';

export default function Loading() {
  return (
    <div className="p-6">
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
