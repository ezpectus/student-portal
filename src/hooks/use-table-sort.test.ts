import { act,renderHook } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { useTableSort } from '@/hooks/use-table-sort';

interface TestItem {
  name: string;
  age: number;
  created: string;
}

const TEST_DATA: TestItem[] = [
  { name: 'Charlie', age: 30, created: '2024-03-01' },
  { name: 'Alice', age: 25, created: '2024-01-01' },
  { name: 'Bob', age: 35, created: '2024-02-01' },
];

describe('useTableSort', () => {
  it('returns unsorted data by default', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA));
    expect(result.current.sortedRows).toEqual(TEST_DATA);
    expect(result.current.getSortDirection('name')).toBeNull();
  });

  it('sorts by string column descending on first click', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA));
    act(() => result.current.handleHeaderClick('name'));
    expect(result.current.sortedRows[0].name).toBe('Charlie');
    expect(result.current.getSortDirection('name')).toBe('desc');
  });

  it('sorts by string column ascending on second click', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA));
    act(() => result.current.handleHeaderClick('name'));
    act(() => result.current.handleHeaderClick('name'));
    expect(result.current.sortedRows[0].name).toBe('Alice');
    expect(result.current.getSortDirection('name')).toBe('asc');
  });

  it('resets sort on third click', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA));
    act(() => result.current.handleHeaderClick('name'));
    act(() => result.current.handleHeaderClick('name'));
    act(() => result.current.handleHeaderClick('name'));
    expect(result.current.sortedRows).toEqual(TEST_DATA);
    expect(result.current.getSortDirection('name')).toBeNull();
  });

  it('sorts by number column correctly', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA));
    act(() => result.current.handleHeaderClick('age'));
    expect(result.current.sortedRows[0].age).toBe(35);
    act(() => result.current.handleHeaderClick('age'));
    expect(result.current.sortedRows[0].age).toBe(25);
  });

  it('generates sortHandlers for sortable headers', () => {
    const { result } = renderHook(() => useTableSort(TEST_DATA, undefined, ['name', 'age']));
    expect(result.current.sortHandlers['name']).toBeDefined();
    expect(result.current.sortHandlers['name'].dir).toBeNull();
    act(() => result.current.sortHandlers['name'].onClick());
    expect(result.current.sortHandlers['name'].dir).toBe('desc');
  });
});
