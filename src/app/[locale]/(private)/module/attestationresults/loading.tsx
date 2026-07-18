import { TableSkeleton } from '@/components/table-skeleton';

export default function AttestationResultsLoading() {
  return (
    <div className="p-6">
      <TableSkeleton rows={6} columns={4} />
    </div>
  );
}
