import { TableSkeleton } from '@/components/table-skeleton';

export default function Loading() {
  return (
    <div className="p-6">
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
}
