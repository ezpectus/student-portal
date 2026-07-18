import { CaretDown,CaretUp } from '@/app/images';

export function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return null;
  return dir === 'asc' ? <CaretUp className="inline-block" /> : <CaretDown className="inline-block" />;
}
