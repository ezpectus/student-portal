import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('page=1'),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  const ITEMS = Array.from({ length: 25 }, (_, i) => i);

  it('returns first page items sliced by pageSize', () => {
    const { result } = renderHook(() => usePagination(10, ITEMS));
    expect(result.current.paginatedItems).toEqual(ITEMS.slice(0, 10));
    expect(result.current.page).toBe(1);
  });

  it('returns all items when pageSize exceeds length', () => {
    const { result } = renderHook(() => usePagination(100, ITEMS));
    expect(result.current.paginatedItems).toEqual(ITEMS);
  });

  it('handles empty items array', () => {
    const { result } = renderHook(() => usePagination(10, []));
    expect(result.current.paginatedItems).toEqual([]);
  });

  it('handles single item', () => {
    const { result } = renderHook(() => usePagination(10, [42]));
    expect(result.current.paginatedItems).toEqual([42]);
  });
});
