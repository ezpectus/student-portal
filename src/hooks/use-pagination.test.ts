import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('page=1'),
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
