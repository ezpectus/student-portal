import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

const toastMock = vi.fn();
vi.mock('./use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

import { useServerErrorToast } from '@/hooks/use-server-error-toast';

describe('useServerErrorToast', () => {
  it('returns an errorToast function', () => {
    const { result } = renderHook(() => useServerErrorToast());
    expect(typeof result.current.errorToast).toBe('function');
  });

  it('calls toast with destructive variant and translated strings', () => {
    toastMock.mockClear();
    const { result } = renderHook(() => useServerErrorToast());

    result.current.errorToast();

    expect(toastMock).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'global.server-error.title',
      description: 'global.server-error.description',
    });
  });
});
