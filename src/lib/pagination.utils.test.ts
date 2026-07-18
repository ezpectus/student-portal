import { describe, expect,it } from 'vitest';

import { createPagesRange } from '@/lib/pagination.utils';

describe('createPagesRange', () => {
  it('returns all pages when total is within visible range', () => {
    expect(createPagesRange({ currentPage: 1, pagesCount: 5, visibleRange: 5 })).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it('returns all pages when pagesCount <= visibleRange + 4', () => {
    expect(createPagesRange({ currentPage: 3, pagesCount: 9, visibleRange: 5 })).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('adds ellipsis at end when current page is near start', () => {
    const result = createPagesRange({ currentPage: 1, pagesCount: 20, visibleRange: 5 });
    expect(result[0]).toBe(1);
    expect(result).toContain('...');
    expect(result[result.length - 1]).toBe(20);
  });

  it('adds ellipsis at start when current page is near end', () => {
    const result = createPagesRange({ currentPage: 20, pagesCount: 20, visibleRange: 5 });
    expect(result[0]).toBe(1);
    expect(result).toContain('...');
    expect(result[result.length - 1]).toBe(20);
  });

  it('adds ellipsis on both sides when current page is in middle', () => {
    const result = createPagesRange({ currentPage: 10, pagesCount: 20, visibleRange: 5 });
    expect(result[0]).toBe(1);
    expect(result[1]).toBe('...');
    expect(result[result.length - 2]).toBe('...');
    expect(result[result.length - 1]).toBe(20);
  });

  it('handles single page', () => {
    expect(createPagesRange({ currentPage: 1, pagesCount: 1, visibleRange: 5 })).toEqual([1]);
  });
});
